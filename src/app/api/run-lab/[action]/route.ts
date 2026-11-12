import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { cookieOptions, isModerator, makeSession, moderator, sessionName, stateName, stateToken } from "@/lib/run-lab/auth";
import { discordApi, isRunId, origin, setting } from "@/lib/run-lab/config";
import { db } from "@/lib/run-lab/db";
import type { Report } from "@/lib/run-lab/queue";

const headers = {"Cache-Control": "private, no-store"};
const failure = (status: number, error: string) => Response.json({error}, {status, headers});
type Context = {params: Promise<{action: string}>};
const reportSchema = z.object({
  start: z.number().int().nonnegative().nullable(), finish: z.number().int().nonnegative().nullable(),
  finishKey: z.enum(["binder", "promos", "promoFrame", "end", ""]), startScanned: z.boolean(), finishScanned: z.boolean(),
});

export async function GET(request: Request, context: Context) {
  const {action} = await context.params;
  const url = new URL(request.url);
  if (action === "reports") {
    if (!await moderator()) return failure(403, "Moderator sign-in required");
    const ids = [...new Set((url.searchParams.get("ids") ?? "").split(",").filter(isRunId))];
    if (ids.length > 100) return failure(400, "Too many run IDs");
    if (!ids.length) return Response.json({}, {headers});
    try {
      const records = await db<{run_id: string; report: Report}[]>("run_lab_reports", {
        run_id: `in.(${ids.join(",")})`, select: "run_id,report",
      });
      return Response.json(Object.fromEntries(records.map(r => [r.run_id, r.report])), {headers});
    } catch { return failure(503, "Shared reports are unavailable"); }
  }

  if (action !== "login" && action !== "callback") return failure(404, "Not found");
  try {
    const callback = origin() + "/api/run-lab/callback";
    const jar = await cookies();
    if (action === "login") {
      const run = url.searchParams.get("run");
      const state = stateToken();
      const authorize = new URL("https://discord.com/oauth2/authorize");
      authorize.search = new URLSearchParams({
        client_id: setting("DISCORD_APP_ID"), response_type: "code", redirect_uri: callback,
        scope: "identify guilds.members.read", state,
      }).toString();
      const response = NextResponse.redirect(authorize);
      response.cookies.set(stateName, `${state}.${isRunId(run) ? run : ""}`, cookieOptions(600));
      return response;
    }
    const [state, run] = (jar.get(stateName)?.value ?? "").split(".");
    const code = url.searchParams.get("code");
    if (!state || state !== url.searchParams.get("state") || !code) return failure(400, "Sign-in expired. Return to /run-lab and try again.");
    const token = await fetch(discordApi + "/oauth2/token", {
      method: "POST", signal: AbortSignal.timeout(8000),
      body: new URLSearchParams({client_id: setting("DISCORD_APP_ID"), client_secret: setting("DISCORD_CLIENT_SECRET"),
        code, grant_type: "authorization_code", redirect_uri: callback}),
    });
    if (!token.ok) return failure(502, "Discord sign-in could not finish");
    const {access_token} = await token.json();
    const member = await fetch(discordApi + `/users/@me/guilds/${setting("DISCORD_SERVER_ID")}/member`, {
      headers: {Authorization: `Bearer ${access_token}`}, signal: AbortSignal.timeout(8000),
    });
    const profile = member.ok ? await member.json() : null;
    if (!profile?.user?.id || !isModerator(profile.roles)) return failure(403, "The Rip It! moderator role is required");
    const session = makeSession(profile.user.id);
    const response = NextResponse.redirect(origin() + "/run-lab" + (isRunId(run) ? `?run=${run}` : ""));
    response.cookies.set(stateName, "", cookieOptions(0));
    response.cookies.set(sessionName, session.value, cookieOptions(session.maxAge));
    return response;
  } catch (error) {
    console.error("Run Lab sign-in failed", error);
    return failure(503, "Discord sign-in is unavailable");
  }
}

export async function POST(request: Request, context: Context) {
  const {action} = await context.params;
  if (action !== "reports") return failure(404, "Not found");
  if (request.headers.get("origin") !== origin()) return failure(403, "Unexpected request origin");
  const user = await moderator();
  if (!user) return failure(403, "Moderator sign-in required");
  const body = await request.json().catch(() => null);
  const parsed = reportSchema.safeParse(body?.report);
  if (!isRunId(body?.runId) || !parsed.success) return failure(400, "Invalid scan result");
  const report = {...parsed.data, at: new Date().toISOString()};
  try {
    await db("run_lab_reports", {on_conflict: "run_id"}, "POST", {run_id: body.runId, author: user, report},
      "resolution=merge-duplicates,return=minimal");
    return Response.json(report, {headers});
  } catch { return failure(503, "Shared report could not be saved"); }
}
