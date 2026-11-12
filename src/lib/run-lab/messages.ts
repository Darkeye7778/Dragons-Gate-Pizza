import { origin, setting } from "./config";
import { db, type Ticket } from "./db";
import { formatTime, runFlags, type Queue, type Report, type Run } from "./queue";

export const noPings = {parse: []};
export const embed = (title: string, description: string) => ({title, description, color: 0x8259d5});
export const mention = (id: string) => `<@${id}>`;
export const linkButton = (label: string, url: string) => ({type: 2, style: 5, label, url});
export const button = (label: string, custom_id: string, disabled = false, style = 2) => ({type: 2, style, label, custom_id, disabled});
export const row = (...components: object[]) => ({type: 1, components});
export const labLink = (run?: string) => origin() + "/run-lab" + (run ? `?run=${run}` : "");

export async function reviewCard(queue: Queue, stale: boolean, run: Run, paginated: boolean) {
  const index = queue.runs.findIndex(item => item.id === run.id);
  const previous = queue.runs[index - 1];
  const next = queue.runs[index + 1];
  const flags = runFlags(run, queue.runs);
  let scan: Report | undefined;
  let reportLine = "No shared scan saved yet.";
  try {
    scan = (await db<{report: Report}[]>("run_lab_reports", {run_id: `eq.${run.id}`, select: "report"}))[0]?.report;
  } catch { reportLine = "Shared scans are unavailable."; }
  const timestamp = Date.parse(run.submitted ?? "");
  const footer = stale ? `Unable to refresh · last checked ${queue.checkedAt}` :
    `${index + 1} of ${queue.runs.length} pending${queue.truncated ? " · partial queue" : ""} · Oldest first`;
  return {
    embeds: [{
      ...embed(`${run.category.slice(0, 100)} · ${run.id}`, [
        `Submitted ${Number.isFinite(timestamp) ? `<t:${Math.floor(timestamp / 1000)}:f>` : "date unavailable"}`,
        `Reported time: **${formatTime(run.seconds == null ? null : run.seconds * 1000)}**`,
        flags.length ? flags.map(flag => `• ${flag}`).join("\n") : "No metadata flags.",
        scan ? `Estimated gameplay start: **${formatTime(scan.start)}**\nEstimated finish: **${formatTime(scan.finish)}**` : reportLine,
        "A moderator makes the final decision.",
      ].join("\n")), footer: {text: footer},
    }],
    components: [row(
      ...(paginated ? [
        button("← Older", `review:${previous?.id ?? run.id}`, !previous),
        button("Newer →", `review:${next?.id ?? run.id}`, !next),
      ] : []), linkButton("Speedrun.com", run.url), linkButton("Open Run Lab", labLink(run.id)),
    )], allowed_mentions: noPings,
  };
}

export function ticketCard(ticket: Ticket, options?: {older?: Ticket; newer?: Ticket; count: number; index: number}) {
  const name = ticket.kind === "appeal" ? "Appeal" : "Ticket";
  const short = ticket.id.slice(-8);
  const status = ticket.closed_at
    ? (ticket.close_notice_id ? "Closed" : "Closed · Archive or notice pending")
    : ticket.claimed_by ? `Claimed by ${mention(ticket.claimed_by)}` : "Unclaimed · Claim to open the channel";
  const showChannel = ticket.channel_id && ticket.claimed_by && !ticket.closed_at;
  const controls: object[] = [];
  if (options) controls.push(button("← Older", `ticket:show:${options.older?.id ?? ticket.id}`, !options.older),
    button("Newer →", `ticket:show:${options.newer?.id ?? ticket.id}`, !options.newer));
  if (showChannel) controls.push(linkButton("Open channel",
    `https://discord.com/channels/${setting("DISCORD_SERVER_ID")}/${ticket.channel_id}`));
  if (!ticket.closed_at) controls.push(
    button(ticket.claimed_by ? "Refresh access" : "Claim", `ticket:claim:${ticket.id}`),
    button("Close", `ticket:close:${ticket.id}`),
  );
  if (ticket.archive_url) controls.push(linkButton("Transcript", ticket.archive_url));
  if (ticket.closed_at && !ticket.close_notice_id) controls.push(button("Finish close", `ticket:finish:${ticket.id}`));
  return {
    embeds: [{...embed(`${name} #${short}`, [
      status, `Opened by ${mention(ticket.opener)}`,
      showChannel ? `Channel: <#${ticket.channel_id}>` : "",
      ticket.run_id ? `Run: https://www.speedrun.com/runs/${ticket.run_id}` : "",
      ticket.closed_at && ticket.outcome ? `Outcome: ${ticket.outcome.slice(0, 1000)}` : "",
    ].filter(Boolean).join("\n")),
    ...(options ? {footer: {text: `${options.index + 1} of ${options.count} open · Oldest first`}} : {})}],
    components: controls.length ? [row(...controls)] : [], allowed_mentions: noPings,
  };
}

export function closedTicketMessage(ticket: Ticket) {
  const appeal = ticket.kind === "appeal";
  const panel = setting(appeal ? "DISCORD_APPEAL_PANEL_ID" : "DISCORD_SUPPORT_PANEL_ID");
  return {
    embeds: [embed(appeal ? "This appeal has been closed" : "This ticket has been closed", [
      ticket.outcome ? `Outcome: ${ticket.outcome}` : "",
      "You can keep this read-only channel if you want to refer to the conversation.",
      "Still need help? Start a new request. Done here? Close and delete this channel.",
    ].filter(Boolean).join("\n\n"))],
    components: [row(
      linkButton(appeal ? "Submit a new appeal" : "Submit a new ticket", `https://discord.com/channels/${setting("DISCORD_SERVER_ID")}/${panel}`),
      button("Close and delete channel", `ticket:delete:${ticket.id}`, false, 4),
    )],
    allowed_mentions: noPings,
  };
}
