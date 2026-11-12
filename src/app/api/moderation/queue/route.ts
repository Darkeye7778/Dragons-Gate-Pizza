import { moderator } from "@/lib/run-lab/auth";
import { getQueue } from "@/lib/run-lab/queue";

export async function GET() {
  const headers = {"Cache-Control": "private, no-store"};
  if (!await moderator()) return Response.json({error: "Moderator sign-in required"}, {status: 403, headers});
  try {
    const {queue, stale} = await getQueue();
    return Response.json({...queue, stale}, {headers});
  } catch { return Response.json({error: "Unable to refresh the Speedrun.com queue"}, {status: 502, headers}); }
}
