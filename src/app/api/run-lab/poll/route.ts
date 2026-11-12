import {timingSafeEqual} from "node:crypto";
import {discord, setting} from "@/lib/run-lab/config";
import {db} from "@/lib/run-lab/db";
import {embed, linkButton, labLink, noPings, row} from "@/lib/run-lab/messages";
import {getQueue, runFlags, runStatus} from "@/lib/run-lab/queue";

type Notice = {run_id: string; category: string; pending_message: string | null; resolved_status: string | null; verified_message: string | null};
export const maxDuration = 60;

export async function POST(request: Request) {
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${process.env.RUN_LAB_POLL_SECRET ?? ""}`);
  if (!process.env.RUN_LAB_POLL_SECRET || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return new Response("Unauthorized", {status: 401});
  }
  try {
    const {queue, stale} = await getQueue();
    if (stale) return Response.json({error: "Unable to refresh", checkedAt: queue.checkedAt}, {status: 502});
    const current = new Set(queue.runs.map(run => run.id));
    const candidates = await db<Notice[]>("run_lab_notices", {
      select: "run_id,category,pending_message,resolved_status,verified_message",
      or: "(resolved_status.is.null,and(resolved_status.eq.verified,verified_message.is.null))",
      order: "created_at.asc", limit: "1000",
    });
    const notices = new Map(candidates.map(n => [n.run_id, n]));
    const pending = queue.runs.filter(run => !notices.get(run.id)?.pending_message).slice(0, 15);
    let sent = 0, verified = 0;
    for (const run of pending) {
      const [known] = await db<Notice[]>("run_lab_notices", {run_id: `eq.${run.id}`, select: "run_id,pending_message,resolved_status"});
      if (known?.pending_message || known?.resolved_status) continue;
      const message = await discord<{id: string}>(`/channels/${setting("DISCORD_PENDING_RUNS_ID")}/messages`, "POST", {
        embeds: [embed("New run needs review", [`${run.category.slice(0, 100)} · ${run.id}`, ...runFlags(run, queue.runs)].join("\n"))],
        components: [row(linkButton("Speedrun.com", run.url), linkButton("Open Run Lab", labLink(run.id)))],
        allowed_mentions: noPings, nonce: `pending-${run.id}`, enforce_nonce: true,
      });
      await db("run_lab_notices", {on_conflict: "run_id"}, "POST", {run_id: run.id, category: run.category, pending_message: message.id},
        "resolution=merge-duplicates,return=minimal");
      sent++;
    }
    if (!queue.truncated) for (const item of candidates.filter(n => !current.has(n.run_id)).slice(0, 15)) {
      const status = item.resolved_status ?? await runStatus(item.run_id);
      if (status !== "verified" && status !== "rejected") continue;
      const where = {run_id: `eq.${item.run_id}`};
      await db("run_lab_notices", where, "PATCH", {resolved_status: status});
      if (status !== "verified" || item.verified_message) continue;
      const url = `https://www.speedrun.com/runs/${item.run_id}`;
      const message = await discord<{id: string}>(`/channels/${setting("DISCORD_VERIFIED_RUNS_ID")}/messages`, "POST", {
        embeds: [embed("Run verified", `${item.category.slice(0, 100)} · [View on Speedrun.com](${url})`)],
        allowed_mentions: noPings, nonce: `verified-${item.run_id}`, enforce_nonce: true,
      });
      await db("run_lab_notices", where, "PATCH", {verified_message: message.id});
      verified++;
    }
    return Response.json({pending: current.size, sent, verified, checkedAt: queue.checkedAt, truncated: queue.truncated});
  } catch (error) {
    console.error("Run Lab poll failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({error: "Queue or notification processing did not complete"}, {status: 502});
  }
}
