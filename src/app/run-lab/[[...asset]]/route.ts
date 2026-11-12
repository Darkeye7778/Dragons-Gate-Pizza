import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { moderator, sessionUser } from "@/lib/run-lab/auth";
import { origin } from "@/lib/run-lab/config";

const types = {
  "index.html": "text/html", "app.js": "text/javascript", "moderation.js": "text/javascript",
  "mp4-frames.js": "text/javascript", "style.css": "text/css",
};
const headers = {
  "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY",
};

export async function GET(request: Request, context: {params: Promise<{asset?: string[]}>}) {
  const {asset = []} = await context.params;
  if (asset.length > 1 || (asset.length === 1 && !Object.hasOwn(types, asset[0]))) {
    return new Response("Not found", {status: 404, headers});
  }
  const document = !asset.length || asset[0] === "index.html";
  if (!(document ? await moderator() : await sessionUser())) {
    if (!document) return new Response("Forbidden", {status: 403, headers});
    const run = new URL(request.url).searchParams.get("run");
    const suffix = run && /^[a-z0-9]{8}$/i.test(run) ? `?run=${run}` : "";
    return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Run Lab sign-in</title><style>body{margin:12vh auto;padding:24px;max-width:38rem;background:#17152d;color:#f5f1ff;font:1rem system-ui}a{color:#dcc6ff}</style><h1>Rip It! Run Lab</h1><p>Sign in with a Discord account that has the moderator role.</p><a href="/api/run-lab/login${suffix}">Sign in with Discord</a></html>`,
      {headers: {...headers, "Content-Type": "text/html; charset=utf-8"}});
  }
  const file = document ? "index.html" : asset[0] as keyof typeof types;
  const contents = await readFile(join(process.cwd(), "src/run-lab-ui", file));
  const redirectTarget = new URL(request.url);
  if (document && redirectTarget.origin !== origin()) {
    return Response.redirect(origin() + "/run-lab" + redirectTarget.search, 302);
  }
  return new Response(new Uint8Array(contents), {headers: {...headers, "Content-Type": `${types[file]}; charset=utf-8`}});
}
