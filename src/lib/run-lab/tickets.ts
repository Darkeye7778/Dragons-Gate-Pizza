import { discord, DiscordApiError, isRunId, setting, speedrunUrl, staffRoleIds } from "./config";
import { db, ticket, ticketFields, ticketForChannel, type Ticket } from "./db";
import { closedTicketMessage, embed, mention, rolePings, ticketCard } from "./messages";
import { archiveTicketTranscript, readTicketTranscript, requireMessageContent, transcriptDestination, type TranscriptMessage } from "./ticket-transcript";

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

async function restrictTicketAccess(channel: string, claimant: string) {
  const current = await channelPermissions(channel);
  const roles = new Set([setting("DISCORD_SERVER_ID"),
    ...[...current.values()].filter(overwrite => overwrite.type === 0).map(overwrite => overwrite.id)]);
  await Promise.all([...roles].map(id =>
    setPermission(channel, permissions(id, 0, BigInt(0), view, current.get(id)), current.get(id))));
  await setPermission(channel, permissions(claimant, 1, write, createThreads, current.get(claimant)), current.get(claimant));
}

async function makeReadOnly(channel: string, opener: string) {
  const current = await channelPermissions(channel);
  const bot = setting("DISCORD_APP_ID");
  const overwrites = [...current.values()].map(overwrite => {
    if (overwrite.type === 1 && overwrite.id === bot) return overwrite;
    if (overwrite.type === 1 && overwrite.id === opener) return permissions(opener, 1, read, denyPosting, overwrite);
    return permissions(overwrite.id, overwrite.type, BigInt(0), view, overwrite);
  });
  if (!current.has(opener)) overwrites.push(permissions(opener, 1, read, denyPosting));
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
      const id = url.pathname.match(/\/runs?\/([a-z0-9]{8})\/?$/i)?.[1];
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
        [runId ? `Run: ${speedrunUrl(runId)}` : "", detail].filter(Boolean).join("\n"))],
    });
    const tracker = await discord<{id: string}>(`/channels/${setting("DISCORD_TICKET_TRACKER_ID")}/messages`, "POST", {
      ...ticketCard(current), ...rolePings(...staffRoleIds()), nonce: `tracker-${id}`.slice(-25), enforce_nonce: true,
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
    await restrictTicketAccess(current.channel_id, moderator);
    current = await ticket(id);
    if (!current?.channel_id) throw new Error("Ticket not found");
    if (current.closed_at) await makeReadOnly(current.channel_id, current.opener);
  }
  await syncTracker(current);
  return current;
}

export async function addTicketParticipant(channel: string, claimant: string, participant: string) {
  const current = await ticketForChannel(channel);
  if (!current || current.closed_at || current.claimed_by !== claimant) return false;
  await restrictTicketAccess(channel, claimant);
  const currentPermissions = await channelPermissions(channel);
  const previous = currentPermissions.get(participant);
  await setPermission(channel, permissions(participant, 1, write, createThreads, previous), previous);
  if ((await ticket(current.id))?.closed_at) {
    await makeReadOnly(channel, current.opener);
    return false;
  }
  return true;
}

export async function closeTicket(id: string, moderator: string, outcome?: string) {
  const initial = await ticket(id);
  if (!initial?.channel_id) throw new Error("Ticket not found");
  if (!initial.closed_at && !outcome) throw new Error("Enter an outcome before closing the ticket");
  const channel = initial.channel_id;
  let current = initial;
  try {
    const destination = current.archive_url ? null : await transcriptDestination(channel);
    let transcript: TranscriptMessage[] | undefined;
    if (!current.closed_at) {
      await requireMessageContent();
      await makeReadOnly(channel, current.opener);
      const messages = await readTicketTranscript(channel);
      const [closed] = await db<Ticket[]>("run_lab_tickets", {id: `eq.${id}`, closed_at: "is.null", select: ticketFields}, "PATCH", {
        closed_at: new Date().toISOString(), outcome, transcript: messages,
      });
      if (closed) transcript = messages;
      current = closed ?? await ticket(id) ?? current;
      if (!current.closed_at) throw new Error("Could not save ticket closure");
    }
    if (!current.close_notice_id) await makeReadOnly(channel, current.opener);
    if (!current.archive_url && destination) {
      if (!transcript) {
        const [saved] = await db<{transcript: TranscriptMessage[] | null}[]>("run_lab_tickets", {id: `eq.${id}`, select: "transcript"});
        transcript = saved?.transcript ?? undefined;
      }
      if (!transcript) throw new Error("Ticket transcript is unavailable");
      const url = await archiveTicketTranscript(current, destination, moderator, transcript);
      const [archived] = await db<Ticket[]>("run_lab_tickets", {id: `eq.${id}`, archive_url: "is.null", select: ticketFields},
        "PATCH", {archive_url: url});
      current = archived ?? await ticket(id) ?? current;
    }
    if (!current.archive_url) throw new Error("Could not save the transcript link");
    if (!current.close_notice_id) {
      const notice = await discord<{id: string}>(`/channels/${channel}/messages`, "POST", {
        ...closedTicketMessage(current), nonce: `receipt-${id}`.slice(-25), enforce_nonce: true,
      });
      const [notified] = await db<Ticket[]>("run_lab_tickets", {id: `eq.${id}`, close_notice_id: "is.null", select: ticketFields},
        "PATCH", {close_notice_id: notice.id});
      current = notified ?? await ticket(id) ?? current;
      if (!current.close_notice_id) throw new Error("Could not save the closure notice");
    }
  } finally {
    await syncTracker(current).catch(error => {
      console.error("Run Lab could not update the ticket tracker", error instanceof Error ? error.message : "Unknown error");
    });
  }
  return current;
}

export async function deleteClosedTicket(id: string, channel: string, user: string) {
  const current = await ticket(id);
  if (current?.channel_id !== channel || current.opener !== user || !current.closed_at ||
      !current.archive_url || !current.close_notice_id) return false;
  try {
    await discord(`/channels/${channel}`, "DELETE");
  } catch (error) {
    if (!(error instanceof DiscordApiError) || error.status !== 404) throw error;
  }
  return true;
}
