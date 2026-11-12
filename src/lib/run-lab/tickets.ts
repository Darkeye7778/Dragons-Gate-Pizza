import { discord, isRunId, setting } from "./config";
import { db, ticket, ticketFields, type Ticket } from "./db";
import { embed, mention, noPings, ticketCard } from "./messages";

const view = 1024, send = 2048, embedLinks = 16384, attach = 32768, read = 65536;
const createThreads = 2 ** 35 + 2 ** 36, sendInThreads = 2 ** 38;
const memberPermissions = String(view | send | embedLinks | attach | read);

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

export async function openTicket(id: string, kind: Ticket["kind"], opener: string, detail: string, runId: string | null) {
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
        type: 0, name: `${kind === "appeal" ? "appeal" : "ticket"}-${id.slice(-8)}`, parent_id: parent, topic,
        permission_overwrites: [
          {id: guild, type: 0, deny: String(view), allow: "0"},
          {id: setting("DISCORD_MOD_ROLE_ID"), type: 0, allow: memberPermissions, deny: "0"},
          {id: opener, type: 1, allow: memberPermissions, deny: String(createThreads)},
          {id: setting("DISCORD_APP_ID"), type: 1, allow: memberPermissions, deny: "0"},
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
  const current = claimed ?? await ticket(id);
  if (!current) throw new Error("Ticket not found");
  await syncTracker(current);
  return current;
}

type TranscriptMessage = {id: string; author: {id: string; username: string}; content: string; timestamp: string;
  attachments?: {filename: string; url: string}[]};

export async function closeTicket(id: string, moderator: string, outcome: string) {
  let current = await ticket(id);
  if (!current?.channel_id) throw new Error("Ticket not found");
  const channel = current.channel_id;
  if (!current.closed_at) {
    // Keep the channel for the runner and staff as a read-only record.
    await discord(`/channels/${channel}/permissions/${current.opener}`, "PUT", {
      type: 1, allow: String(view | read), deny: String(send + attach + createThreads + sendInThreads),
    });
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
