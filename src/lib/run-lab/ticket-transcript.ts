import {createHash} from "node:crypto";
import {discord, isId, setting} from "./config";
import {type Ticket} from "./db";
import {embed, mention, noPings} from "./messages";

export type TranscriptMessage = {
  id: string;
  author: {id: string; username: string};
  content: string;
  timestamp: string;
  attachments?: {filename: string; url: string}[];
};

export async function requireMessageContent() {
  const {flags} = await discord<{flags?: number}>("/applications/@me");
  const messageContentFlags = (1 << 18) | (1 << 19);
  if (!((flags ?? 0) & messageContentFlags)) throw new Error("Enable Discord Message Content Intent before archiving tickets");
}

export async function readTicketTranscript(channel: string) {
  const transcript: TranscriptMessage[] = [];
  let before = "";
  for (;;) {
    const page = await discord<TranscriptMessage[]>(`/channels/${channel}/messages?limit=100${before ? `&before=${before}` : ""}`);
    transcript.push(...page.map(({id, author, content, timestamp, attachments}) => ({
      id, author: {id: author.id, username: author.username}, content, timestamp,
      attachments: attachments?.map(({filename, url}) => ({filename, url})),
    })));
    if (page.length < 100) return transcript.reverse();
    before = page[99].id;
  }
}

export async function transcriptDestination(ticketChannel: string) {
  const channel = process.env.DISCORD_TICKET_LOGS_ID?.trim() || setting("DISCORD_MOD_LOG_ID");
  if (!isId(channel) || channel === ticketChannel) throw new Error("Invalid ticket logs channel");
  const guild = setting("DISCORD_SERVER_ID");
  const destination = await discord<{
    guild_id?: string; type: number; permission_overwrites?: {id: string; type: number; deny: string}[];
  }>(`/channels/${channel}`);
  const everyone = destination.permission_overwrites?.find(overwrite => overwrite.type === 0 && overwrite.id === guild);
  if (destination.guild_id !== guild || destination.type !== 0 || !(BigInt(everyone?.deny ?? "0") & BigInt(1024))) {
    throw new Error("Ticket logs must use a private text channel in this server");
  }
  return channel;
}

function transcriptParts(ticket: Ticket, messages: TranscriptMessage[]) {
  const header = [
    `Rip It! Run Lab ${ticket.kind} ticket ${ticket.id}`,
    `Opened by ${ticket.opener} on ${ticket.created_at}`,
    `Closed on ${ticket.closed_at}`,
    ticket.run_id ? `Run ID: ${ticket.run_id}` : "",
    `Outcome: ${ticket.outcome ?? ""}`,
    `Original request:\n${ticket.detail}`,
    "Conversation",
  ].filter(Boolean).join("\n\n") + "\n\n";
  const limit = 8 * 1024 * 1024;
  const parts: string[] = [];
  let text = header;
  let bytes = Buffer.byteLength(header);
  for (const {author, timestamp, content, attachments} of messages) {
    const files = (attachments ?? []).map(({filename, url}) => `Attachment: ${filename} (${url})`);
    const line = [`[${timestamp}] ${author.username} (${author.id})`, content, ...files].filter(Boolean).join("\n") + "\n\n";
    const lineBytes = Buffer.byteLength(line);
    if (bytes + lineBytes > limit) {
      parts.push(text);
      text = header;
      bytes = Buffer.byteLength(header);
    }
    text += line;
    bytes += lineBytes;
  }
  parts.push(text);
  return parts;
}

export async function archiveTicketTranscript(ticket: Ticket, destination: string, moderator: string, transcript: TranscriptMessage[]) {
  const parts = transcriptParts(ticket, transcript);
  let firstMessageId = "";
  const guild = setting("DISCORD_SERVER_ID");
  const title = `${ticket.kind === "appeal" ? "Appeal" : "Ticket"} #${ticket.id.slice(-8)} closed`;
  for (const [index, part] of parts.entries()) {
    const filename = `ticket-${ticket.id}${parts.length > 1 ? `-part-${index + 1}` : ""}.txt`;
    const form = new FormData();
    const description = [
      `Opened by ${mention(ticket.opener)} · Archived by ${mention(moderator)}`,
      ticket.run_id ? `Run ID: ${ticket.run_id}` : "",
      `Outcome: ${ticket.outcome ?? ""}`,
      parts.length > 1 ? `Transcript part ${index + 1} of ${parts.length}` : "",
    ].filter(Boolean).join("\n");
    const nonce = createHash("sha256").update(`ticket-transcript:${ticket.id}:${index}`).digest("hex").slice(0, 25);
    form.set("payload_json", JSON.stringify({
      embeds: [embed(title, description)], allowed_mentions: noPings, nonce, enforce_nonce: true,
      attachments: [{id: 0, filename}],
    }));
    form.set("files[0]", new Blob([part], {type: "text/plain;charset=utf-8"}), filename);
    const message = await discord<{id: string}>(`/channels/${destination}/messages`, "POST", form);
    if (!isId(message.id)) throw new Error("Discord did not return the transcript message ID");
    if (!firstMessageId) firstMessageId = message.id;
  }
  return `https://discord.com/channels/${guild}/${destination}/${firstMessageId}`;
}
