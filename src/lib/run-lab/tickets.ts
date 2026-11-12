import { discord, isRunId, setting, staffRoleIds } from "./config";
import { db, ticket, ticketFields, ticketForChannel, type Ticket } from "./db";
import { embed, mention, noPings, ticketCard } from "./messages";

const view = BigInt(1024);
const read = view | BigInt(65536);
const write = read | BigInt(2048 | 16384 | 32768);
const createThreads = BigInt(2 ** 35 + 2 ** 36);
const denyPosting = BigInt(2048 | 32768) | createThreads | BigInt(2 ** 38);

type Overwrite = {id: string; type: 0 | 1; allow: string; deny: string};

function permissions(id: string, type: Overwrite["type"], allow: bigint, deny: bigint, existing?: Overwrite): Overwrite {
  return {
    id, type,
    allow: ((BigInt(existing?.allow ?? "0") | allow) & ~deny).toString(),
    deny: ((BigInt(existing?.deny ?? "0") | deny) & ~allow).toString(),
  };
}

async function channelPermissions(channel: string) {
  const {permission_overwrites} = await discord<{permission_overwrites: Overwrite[]}>(`/channels/${channel}`);
  return new Map(permission_overwrites.map(overwrite => [overwrite.id, overwrite]));
}

async function setPermission(channel: string, next: Overwrite, current?: Overwrite) {
  if (current?.allow === next.allow && current.deny === next.deny) return;
  const {id, ...overwrite} = next;
  await discord(`/channels/${channel}/permissions/${id}`, "PUT", overwrite);
}

async function restrictStaffReplies(channel: string, claimant: string) {
  const current = await channelPermissions(channel);
  const staff = staffRoleIds();
  const roles = new Set([...staff, setting("DISCORD_SERVER_ID"),
    ...[...current.values()].filter(overwrite => overwrite.type === 0).map(overwrite => overwrite.id)]);
  await setPermission(channel, permissions(claimant, 1, write, createThreads, current.get(claimant)), current.get(claimant));
  await Promise.all([...roles].map(id =>
    setPermission(channel, permissions(id, 0, staff.includes(id) ? read : BigInt(0), denyPosting, current.get(id)), current.get(id))));
}

async function makeReadOnly(channel: string) {
  const current = await channelPermissions(channel);
  const bot = setting("DISCORD_APP_ID");
  const overwrites = [...current.values()].map(overwrite => overwrite.id === bot && overwrite.type === 1 ? overwrite :
    permissions(overwrite.id, overwrite.type, BigInt(0), denyPosting, overwrite));
  if (overwrites.some(overwrite => overwrite.allow !== current.get(overwrite.id)?.allow ||
      overwrite.deny !== current.get(overwrite.id)?.deny)) {
    await discord(`/channels/${channel}`, "PATCH", {permission_overwrites: overwrites});
  }
}

function ticketChannelName(id: string, kind: Ticket["kind"], subject: string, runId: string | null) {
  const slug = subject.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48).replace(/-$/, "");
  const suffix = id.slice(-8);
  return kind === "appeal" ? `appeal-${runId?.toLowerCase() ?? "run"}-${suffix}` : `ticket-${slug || "support"}-${suffix}`;
}

export function parseRunLink(value: string) {
  if (isRunId(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" && ["speedrun.com", "www.speedrun.com"].includes(url.hostname)) {
      const id = url.pathname.match(/\/runs\/([a-z0-9]{8})\/?$/i)?.[1];
      if (id && isRunId(id)) return id;
    }
  } catch { /* An ID is also accepted. */ }
  return null;
}

export async function openTicket(id: string, kind: Ticket["kind"], opener: string, detail: string, runId: string | null, subject = "") {
  await db("run_lab_tickets", {on_conflict: "id"}, "POST", {id, kind, opener, detail, run_id: runId},
    "resolution=ignore-duplicates,return=minimal");
  let current = await ticket(id);
  if (!current) throw new Error("Ticket record unavailable");
  const guild = setting("DISCORD_SERVER_ID");
  if (!current.channel_id) {
    const topic = `Run Lab ticket ${id}`;
    const channels = await discord<{id: string; topic?: string; parent_id?: string}[]>(`/guilds/${guild}/channels`);
    const parent = setting("DISCORD_OPEN_TICKETS_CATEGORY_ID");
    const channel = channels.find(c => c.topic === topic && c.parent_id === parent) ??
      await discord<{id: string}>(`/guilds/${guild}/channels`, "POST", {
        type: 0, name: ticketChannelName(id, kind, subject, runId), parent_id: parent, topic,
        permission_overwrites: [
          permissions(guild, 0, BigInt(0), view),
          ...staffRoleIds().map(role => permissions(role, 0, write, BigInt(0))),
          permissions(opener, 1, write, createThreads),
          permissions(setting("DISCORD_APP_ID"), 1, write, BigInt(0)),
        ],
      });
    [current] = await db<Ticket[]>("run_lab_tickets", {id: `eq.${id}`, select: ticketFields}, "PATCH", {channel_id: channel.id});
  }
  if (!current.tracker_id) {
    await discord(`/channels/${current.channel_id}/messages`, "POST", {
      content: mention(opener), allowed_mentions: {parse: [], users: [opener]}, nonce: `ticket-${id}`.slice(-25), enforce_nonce: true,
      embeds: [embed(kind === "appeal" ? "Run appeal opened" : "Support ticket opened",
        [runId ? `Run: https://www.speedrun.com/runs/${runId}` : "", detail].filter(Boolean).join("\n"))],
    });
    const tracker = await discord<{id: string}>(`/channels/${setting("DISCORD_TICKET_TRACKER_ID")}/messages`, "POST", {
      ...ticketCard(current), nonce: `tracker-${id}`.slice(-25), enforce_nonce: true,
    });
    [current] = await db<Ticket[]>("run_lab_tickets", {id: `eq.${id}`, select: ticketFields}, "PATCH", {tracker_id: tracker.id});
  }
  return current;
}

export async function syncTracker(current: Ticket) {
  if (current.tracker_id) await discord(`/channels/${setting("DISCORD_TICKET_TRACKER_ID")}/messages/${current.tracker_id}`,
    "PATCH", ticketCard(current));
}

export async function claimTicket(id: string, moderator: string) {
  const [claimed] = await db<Ticket[]>("run_lab_tickets", {
    id: `eq.${id}`, claimed_by: "is.null", closed_at: "is.null", select: ticketFields,
  }, "PATCH", {claimed_by: moderator});
  let current = claimed ?? await ticket(id);
  if (!current?.channel_id) throw new Error("Ticket not found");
  if (!current.closed_at && current.claimed_by === moderator) {
    await restrictStaffReplies(current.channel_id, moderator);
    current = await ticket(id);
    if (!current?.channel_id) throw new Error("Ticket not found");
    if (current.closed_at) await makeReadOnly(current.channel_id);
  }
  await syncTracker(current);
  return current;
}

export async function addTicketParticipant(channel: string, claimant: string, participant: string) {
  const current = await ticketForChannel(channel);
  if (!current || current.closed_at || current.claimed_by !== claimant) return false;
  await restrictStaffReplies(channel, claimant);
  const currentPermissions = await channelPermissions(channel);
  const previous = currentPermissions.get(participant);
  await setPermission(channel, permissions(participant, 1, write, createThreads, previous), previous);
  if ((await ticket(current.id))?.closed_at) {
    await makeReadOnly(channel);
    return false;
  }
  return true;
}

type TranscriptMessage = {id: string; author: {id: string; username: string}; content: string; timestamp: string;
  attachments?: {filename: string; url: string}[]};

export async function closeTicket(id: string, moderator: string, outcome: string) {
  let current = await ticket(id);
  if (!current?.channel_id) throw new Error("Ticket not found");
  const channel = current.channel_id;
  if (!current.closed_at) {
    // Keep the channel for the runner and staff as a read-only record.
    await makeReadOnly(channel);
    const transcript: TranscriptMessage[] = [];
    let before = "";
    for (;;) {
      const page = await discord<TranscriptMessage[]>(`/channels/${channel}/messages?limit=100${before ? `&before=${before}` : ""}`);
      transcript.push(...page.map(({id, author, content, timestamp, attachments}) =>
        ({id, author: {id: author.id, username: author.username}, content, timestamp,
          attachments: attachments?.map(({filename, url}) => ({filename, url}))})));
      if (page.length < 100) break;
      before = page[99].id;
    }
    const [closed] = await db<Ticket[]>("run_lab_tickets", {id: `eq.${id}`, closed_at: "is.null", select: ticketFields}, "PATCH", {
      closed_at: new Date().toISOString(), outcome, transcript: transcript.reverse(),
    });
    current = closed ?? await ticket(id);
    if (!current) throw new Error("Ticket not found");
  }
  await makeReadOnly(channel);
  await syncTracker(current);
  const message = {embeds: [embed("Ticket closed", `Outcome: ${current.outcome}\nClosed by ${mention(moderator)}`)], allowed_mentions: noPings};
  await Promise.all([
    discord(`/channels/${channel}/messages`, "POST", {...message, nonce: `close-${id}`.slice(-25), enforce_nonce: true}),
    discord(`/channels/${setting("DISCORD_MOD_LOG_ID")}/messages`, "POST", {
      ...message, content: `<#${channel}>${current.run_id ? ` · run ${current.run_id}` : ""}`, nonce: `log-${id}`.slice(-25), enforce_nonce: true,
    }),
  ]);
  return current;
}
