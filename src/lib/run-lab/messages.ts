import { origin, setting } from "./config";
import { db, type Ticket } from "./db";
import { formatTime, runFlags, type Queue, type Report, type Run } from "./queue";

export const noPings = {parse: []};
export const embed = (title: string, description: string) => ({title, description, color: 0x8259d5});
export const mention = (id: string) => `<@${id}>`;
export const linkButton = (label: string, url: string) => ({type: 2, style: 5, label, url});
export const button = (label: string, custom_id: string, disabled = false) => ({type: 2, style: 2, label, custom_id, disabled});
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
  const status = ticket.closed_at ? "Closed" : ticket.claimed_by ? `Claimed by ${mention(ticket.claimed_by)}` : "Open · Unclaimed";
  const controls: object[] = [];
  if (options) controls.push(button("← Older", `ticket:show:${options.older?.id ?? ticket.id}`, !options.older),
    button("Newer →", `ticket:show:${options.newer?.id ?? ticket.id}`, !options.newer));
  if (ticket.channel_id) controls.push(linkButton("Open channel",
    `https://discord.com/channels/${setting("DISCORD_SERVER_ID")}/${ticket.channel_id}`));
  if (!ticket.closed_at) controls.push(
    button("Claim", `ticket:claim:${ticket.id}`, !!ticket.claimed_by),
    button("Close", `ticket:close:${ticket.id}`),
  );
  return {
    embeds: [{...embed(`${name} #${short}`, [
      status, `Opened by ${mention(ticket.opener)}`,
      ticket.run_id ? `Run: https://www.speedrun.com/runs/${ticket.run_id}` : "",
      ticket.closed_at && ticket.outcome ? `Outcome: ${ticket.outcome.slice(0, 1000)}` : "",
    ].filter(Boolean).join("\n")),
    ...(options ? {footer: {text: `${options.index + 1} of ${options.count} open · Oldest first`}} : {})}],
    components: controls.length ? [row(...controls)] : [], allowed_mentions: noPings,
  };
}
