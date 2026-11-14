import {timingSafeEqual} from "node:crypto";
import {discord, isId, setting, speedrunUrl, staffRoleIds} from "@/lib/run-lab/config";
import {db} from "@/lib/run-lab/db";
import {embed, linkButton, labLink, rolePings, row} from "@/lib/run-lab/messages";
import {getQueue, isWorldRecord, readVerifiedRuns, runFlags} from "@/lib/run-lab/queue";

type Notice = {run_id: string; pending_message: string | null; resolved_status: string | null; verified_message: string | null};
const verifiedPollKey = "rip-it-verified";
const hour = 60 * 60 * 1000;
export const maxDuration = 60;

export async function POST(request: Request) {
  const actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${process.env.RUN_LAB_POLL_SECRET ?? ""}`);
  if (!process.env.RUN_LAB_POLL_SECRET || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return new Response("Unauthorized", {status: 401});
  }
  const startedAt = new Date();
  try {
    const {queue, stale} = await getQueue();
    if (stale) return Response.json({error: "Unable to refresh", checkedAt: queue.checkedAt}, {status: 502});
    const alreadyNotified = new Set<string>();
    for (let offset = 0; offset < queue.runs.length; offset += 200) {
      const ids = queue.runs.slice(offset, offset + 200).map(run => run.id);
      const notices = await db<Notice[]>("run_lab_notices", {
        run_id: `in.(${ids.join(",")})`, select: "run_id,pending_message,resolved_status",
      });
      for (const notice of notices) {
        if (notice.pending_message || notice.resolved_status) alreadyNotified.add(notice.run_id);
      }
    }
    const pending = queue.runs.filter(run => !alreadyNotified.has(run.id)).slice(0, 15);
    let sent = 0, verified = 0;
    for (const run of pending) {
      const [known] = await db<Notice[]>("run_lab_notices", {run_id: `eq.${run.id}`, select: "run_id,pending_message,resolved_status"});
      if (known?.pending_message || known?.resolved_status) continue;
      const message = await discord<{id: string}>(`/channels/${setting("DISCORD_PENDING_RUNS_ID")}/messages`, "POST", {
        embeds: [embed("New run needs review", [`${run.category.slice(0, 100)} · ${run.id}`, ...runFlags(run, queue.runs)].join("\n"))],
        components: [row(linkButton("Speedrun.com", run.url), linkButton("Open Run Lab", labLink(run.id)))],
        ...rolePings(...staffRoleIds()), nonce: `pending-${run.id}`, enforce_nonce: true,
      });
      await db("run_lab_notices", {on_conflict: "run_id"}, "POST", {run_id: run.id, category: run.category, pending_message: message.id},
        "resolution=merge-duplicates,return=minimal");
      sent++;
    }
    const [checkpoint] = await db<{snapshot: {checkedAt: string}}[]>("run_lab_queue", {
      key: `eq.${verifiedPollKey}`, select: "snapshot",
    });
    const lastCheck = Date.parse(checkpoint?.snapshot?.checkedAt ?? "");
    // Revisit the most recent hour to pick up late results from Speedrun.com's API.
    const since = Number.isFinite(lastCheck) ? Math.min(lastCheck, +startedAt) - hour : +startedAt - 24 * hour;
    let verifiedFailed = false;
    for (const {run, category} of await readVerifiedRuns(since)) {
      try {
        const [known] = await db<Pick<Notice, "verified_message">[]>("run_lab_notices", {
          run_id: `eq.${run.id}`, select: "verified_message",
        });
        if (known?.verified_message) continue;
        const recordRole = process.env.DISCORD_WR_UPDATES_ROLE_ID;
        const record = isId(recordRole) && await isWorldRecord(run);
        const url = speedrunUrl(run.id);
        const message = await discord<{id: string}>(`/channels/${setting("DISCORD_VERIFIED_RUNS_ID")}/messages`, "POST", {
          embeds: [embed(record ? "New world record" : "Run verified", `${category.slice(0, 100)} · [View on Speedrun.com](${url})`)],
          ...rolePings(process.env.DISCORD_NEW_RUNS_ROLE_ID, record ? recordRole : undefined),
          nonce: `verified-${run.id}`, enforce_nonce: true,
        });
        await db("run_lab_notices", {on_conflict: "run_id"}, "POST", {
          run_id: run.id, category, resolved_status: "verified", verified_message: message.id,
        }, "resolution=merge-duplicates,return=minimal");
        verified++;
      } catch (error) {
        verifiedFailed = true;
        console.error("Run Lab could not announce verified run", run.id, error instanceof Error ? error.message : "Unknown error");
      }
    }
    if (verifiedFailed) return Response.json({error: "Some verified announcements could not be sent", sent, verified}, {status: 502});
    await db("run_lab_queue", {on_conflict: "key"}, "POST", {
      key: verifiedPollKey, snapshot: {checkedAt: startedAt.toISOString()},
    }, "resolution=merge-duplicates,return=minimal");
    return Response.json({pending: queue.runs.length, sent, verified, checkedAt: queue.checkedAt, truncated: queue.truncated});
  } catch (error) {
    console.error("Run Lab poll failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({error: "Queue or notification processing did not complete"}, {status: 502});
  }
}
