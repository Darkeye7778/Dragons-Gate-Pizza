import {createPublicKey, verify} from "node:crypto";
import {after} from "next/server";
import {discordApi, isId, isRunId, setting} from "@/lib/run-lab/config";
import {isModerator} from "@/lib/run-lab/auth";
import {openTickets, ticket} from "@/lib/run-lab/db";
import {button, embed, noPings, reviewCard, row, ticketCard} from "@/lib/run-lab/messages";
import {getQueue} from "@/lib/run-lab/queue";
import {addTicketParticipant, claimTicket, closeTicket, openTicket, parseRunLink} from "@/lib/run-lab/tickets";

export const maxDuration = 60;

type Option = {name: string; value?: string; options?: Option[]};
type Input = {custom_id?: string; value?: string; component?: Input; components?: Input[]};
type Interaction = {
  id: string; type: number; token: string; application_id: string; guild_id?: string; channel_id?: string;
  member?: {roles: string[]; user?: {id: string}};
  data?: {
    name?: string; custom_id?: string; options?: Option[]; components?: Input[];
    resolved?: {members?: Record<string, object>; users?: Record<string, {bot?: boolean}>};
  };
};

type Message = {embeds: object[]; components?: object[]; allowed_mentions?: object};
const note = (description: string, title = "Rip It! Run Lab"): Message =>
  ({embeds: [embed(title, description)], components: [], allowed_mentions: noPings});

function reply(message: Message, ephemeral = false) {
  return Response.json({type: 4, data: {...message, ...(ephemeral ? {flags: 64} : {})}});
}

function work(i: Interaction, kind: "public" | "private" | "update", task: () => Promise<Message>) {
  after(async () => {
    let message;
    try { message = await task(); }
    catch (error) {
      console.error("Run Lab interaction failed", error instanceof Error ? error.message : "Unknown error");
      message = note("This action couldn’t finish. Try again or contact a moderator.", "Run Lab unavailable");
    }
    try {
      const response = await fetch(`${discordApi}/webhooks/${i.application_id}/${encodeURIComponent(i.token)}/messages/@original`, {
        method: "PATCH", headers: {"Content-Type": "application/json"}, body: JSON.stringify(message),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) console.error("Discord could not deliver interaction reply", response.status);
    } catch { console.error("Discord interaction reply request failed"); }
  });
  return Response.json(kind === "update" ? {type: 6} : {type: 5, ...(kind === "private" ? {data: {flags: 64}} : {})});
}

function field(label: string, custom_id: string, style: number, max_length: number, required = true) {
  return {type: 18, label, component: {type: 4, custom_id, style, required, max_length}};
}

function modal(custom_id: string, title: string, ...components: object[]) {
  return Response.json({type: 9, data: {custom_id, title, components}});
}

function values(inputs: Input[]): Record<string, string> {
  return Object.fromEntries(inputs.flatMap(item => {
    const children = item.component ? [item.component] : item.components ?? [];
    return children.flatMap(child => child.custom_id && typeof child.value === "string" ? [[child.custom_id, child.value]] : []);
  }));
}

async function showReview(runId?: string, browse = true): Promise<Message> {
  const {queue, stale} = await getQueue();
  const suffix = stale ? `\nUnable to refresh · last checked ${queue.checkedAt}` : "";
  if (!queue.runs.length) return note((stale ? "The last successful check had an empty queue." : "No runs are awaiting verification.") + suffix);
  const run = runId ? queue.runs.find(r => r.id === runId) : queue.runs[0];
  if (!run) return {
    ...note("That run is no longer in this pending queue." + suffix),
    components: [row(button("Back to oldest", "review:oldest"))],
  };
  return reviewCard(queue, stale, run, browse);
}

async function showQueue(): Promise<Message> {
  const {queue, stale} = await getQueue();
  const lines = queue.runs.slice(0, 20).map(r => `• ${r.category.slice(0, 70)} · [${r.id}](${r.url})`);
  const status = stale ? `Unable to refresh · last checked ${queue.checkedAt}\n` : "";
  return {
    ...note(status + (lines.length ? lines.join("\n") : (stale ? "The saved queue was empty." : "No pending submissions.")) +
      (queue.runs.length > 20 ? `\nShowing 20 of ${queue.runs.length}. Use the browser below for the rest.` : "") +
      (queue.truncated ? "\nSpeedrun.com queue was truncated." : ""), "Pending runs · Oldest first"),
    components: queue.runs.length ? [row(button("Browse runs", "review:oldest"))] : [],
  };
}

async function showTicket(id?: string): Promise<Message> {
  const tickets = await openTickets();
  const index = id ? tickets.findIndex(item => item.id === id) : 0;
  const current = tickets[index];
  if (!current) {
    if (id && tickets.length) return {...note("That ticket has closed."), components: [row(button("Back to oldest", "ticket:show:oldest"))]};
    return note("No tickets or appeals are open.", "Open tickets");
  }
  return ticketCard(current, {older: tickets[index - 1], newer: tickets[index + 1], count: tickets.length, index});
}

function validSignature(request: Request, raw: Buffer) {
  const signature = request.headers.get("x-signature-ed25519") ?? "";
  const timestamp = request.headers.get("x-signature-timestamp") ?? "";
  const key = process.env.DISCORD_PUBLIC_KEY ?? "";
  if (!/^[a-f0-9]{128}$/i.test(signature) || !/^\d{10}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(key) ||
      Math.abs(Date.now() - Number(timestamp) * 1000) > 5 * 60 * 1000) return false;
  return verify(null, Buffer.concat([Buffer.from(timestamp), raw]), createPublicKey({
    format: "der", type: "spki", key: Buffer.from("302a300506032b6570032100" + key, "hex"),
  }), Buffer.from(signature, "hex"));
}

export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  if (!validSignature(request, raw)) return new Response("Invalid signature", {status: 401});
  let i: Interaction;
  try { i = JSON.parse(raw.toString()); } catch { return new Response("Invalid body", {status: 400}); }
  if (i.type === 1) return Response.json({type: 1});
  if (i.application_id !== setting("DISCORD_APP_ID") || i.guild_id !== setting("DISCORD_SERVER_ID") ||
      !isId(i.id) || !isId(i.member?.user?.id)) return reply(note("Use this bot in the Rip It! server."), true);

  const user = i.member!.user!.id;
  const channel = i.channel_id;
  const custom = i.data?.custom_id ?? "";
  const tracker = channel === setting("DISCORD_TICKET_TRACKER_ID");
  const review = channel === setting("DISCORD_RUN_REVIEW_ID");
  const deny = () => reply(note("This action requires the moderator role and the designated staff channel."), true);

  if (i.type === 2) {
    const options = i.data?.options ?? [];
    if (i.data?.name === "ticket" && options[0]?.name === "add") {
      if (!isModerator(i.member?.roles) || !isId(channel)) {
        return reply(note("Only the moderator or admin who claimed the ticket can add someone."), true);
      }
      const participant = options[0].options?.find(option => option.name === "member")?.value;
      const resolved = i.data.resolved;
      if (!isId(participant) || !resolved?.members?.[participant] || !resolved.users?.[participant] ||
          resolved.users[participant].bot || participant === setting("DISCORD_APP_ID")) {
        return reply(note("Choose a person from this server to add to the ticket."), true);
      }
      return work(i, "private", async () => note(await addTicketParticipant(channel, user, participant)
        ? `<@${participant}> can now read and reply in this ticket.`
        : "Run this inside an open ticket you claimed."));
    }
    if (!isModerator(i.member?.roles)) return deny();
    if (i.data?.name === "review" && review) {
      const runId = options.find(option => option.name === "run")?.value;
      if (runId && !isRunId(runId)) return reply(note("Enter an eight-character Speedrun.com run ID."), true);
      return work(i, "public", () => showReview(runId));
    }
    if (i.data?.name === "list" && options[0]?.name === "runs" && review) return work(i, "public", showQueue);
    if (i.data?.name === "list" && options[0]?.name === "tickets" && tracker) return work(i, "public", () => showTicket());
    return deny();
  }

  const intake = custom.match(/^intake:(appeal|support)$/)?.[1] as "appeal" | "support" | undefined;
  if (intake) {
    const appeal = intake === "appeal";
    const expected = setting(appeal ? "DISCORD_APPEAL_PANEL_ID" : "DISCORD_SUPPORT_PANEL_ID");
    if (channel !== expected) return reply(note("Open this form from the Help category."), true);
    if (i.type === 3) return appeal
      ? modal(custom, "Appeal a run decision", field("Speedrun.com run link or ID", "run", 1, 200),
          field("Why should we take another look?", "detail", 2, 1500), field("Relevant timestamps", "times", 1, 200, false))
      : modal(custom, "Open a support ticket", field("Short title (used for the channel name)", "subject", 1, 70),
          field("What can the mods help with?", "detail", 2, 1500));
    if (i.type === 5) {
      const input = values(i.data?.components ?? []);
      const runId = appeal ? parseRunLink(input.run?.trim() ?? "") : null;
      if (appeal && !runId) return reply(note("Please use a Speedrun.com run URL or eight-character run ID. Reopen the appeal form to try again."), true);
      if (!input.detail?.trim()) return reply(note("Add a short explanation and try again."), true);
      const detail = input.detail.trim().slice(0, 1500) + (input.times?.trim() ? `\nTimestamps: ${input.times.trim().slice(0, 200)}` : "");
      return work(i, "private", async () => {
        const result = await openTicket(i.id, intake, user, detail, runId, input.subject?.trim().slice(0, 70));
        return note(`Your private channel is <#${result.channel_id}>.`, appeal ? "Appeal opened" : "Ticket opened");
      });
    }
  }

  if (!isModerator(i.member?.roles)) return deny();
  const run = custom.match(/^review:(oldest|[a-z0-9]{8})$/i)?.[1];
  if (i.type === 3 && run && review) return work(i, "update", () => showReview(run === "oldest" ? undefined : run));
  const control = custom.match(/^ticket:(show|claim|close):(oldest|\d{16,22})$/);
  if (!control || !tracker) return deny();
  const [, action, id] = control;
  if (i.type === 3 && action === "show") return work(i, "update", () => showTicket(id === "oldest" ? undefined : id));
  if (!isId(id)) return deny();
  if (i.type === 3 && action === "claim") return work(i, "private", async () => {
    const current = await claimTicket(id, user);
    return note(current.closed_at ? "This ticket is already closed." :
      current.claimed_by === user ? `You can now open <#${current.channel_id}>.` : `Already claimed by <@${current.claimed_by}>.`);
  });
  if (i.type === 3 && action === "close") return modal(custom, "Close ticket", field("Outcome or reason for closing", "outcome", 2, 1000));
  if (i.type === 5 && action === "close") {
    const outcome = values(i.data?.components ?? []).outcome?.trim().slice(0, 1000);
    if (!outcome) return reply(note("Enter an outcome before closing the ticket."), true);
    return work(i, "private", async () => {
      if (!await ticket(id)) return note("Ticket not found.");
      const closed = await closeTicket(id, user, outcome);
      return note(`Closed <#${closed.channel_id}> and saved its transcript.`);
    });
  }
  return deny();
}
