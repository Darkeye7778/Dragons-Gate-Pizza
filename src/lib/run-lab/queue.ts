import { gameId, gameUrl, isRunId, speedrunUrl } from "./config";
import { db } from "./db";

export type Run = {
  id: string; category: string; submitted: string | null; seconds: number | null;
  url: string; videos: string[]; videoText: string; players: string[]; comment: string;
};
export type Queue = { game: { id: string; name: string; url: string }; checkedAt: string; truncated: boolean; runs: Run[] };
export type Report = { start: number | null; finish: number | null; finishKey: string; startScanned: boolean; finishScanned: boolean; at: string };
type SourceRun = {
  id: string; game: string; category: string; submitted?: string; times?: { primary_t?: number };
  status?: { status?: string }; videos?: { links?: { uri: string }[]; text?: string };
  players?: { name?: string; id?: string }[]; comment?: string;
};

async function upstream<T>(path: string, params: Record<string, string> = {}) {
  const url = new URL(path, "https://www.speedrun.com/api/v1/");
  url.search = new URLSearchParams(params).toString();
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(9000), headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Speedrun.com returned HTTP ${res.status}`);
  const payload = await res.json();
  if (!payload?.data) throw new Error("Speedrun.com returned unexpected data");
  return payload as { data: T; pagination?: { links?: { rel: string }[] } };
}

export function webUrl(value: string): string {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

export async function readLiveQueue(): Promise<Queue> {
  const params = { game: gameId, status: "new", orderby: "submitted", direction: "asc", max: "200" };
  const [categories, first] = await Promise.all([
    upstream<{id: string; name: string}[]>(`games/${gameId}/categories`), upstream<SourceRun[]>("runs", params),
  ]);
  const names = new Map(categories.data.map(({id, name}) => [id, name]));
  const raw = [...first.data];
  let page = first;
  for (let offset = 200; offset < 1000 && page.pagination?.links?.some(l => l.rel === "next"); offset += 200) {
    page = await upstream<SourceRun[]>("runs", {...params, offset: String(offset)});
    raw.push(...page.data);
  }
  const runs = [...new Map(raw.filter(r => r.game === gameId && r.status?.status === "new" && isRunId(r.id)).map(r => [r.id, {
    id: r.id, category: names.get(r.category) ?? "Unknown category", submitted: r.submitted ?? null,
    seconds: r.times?.primary_t ?? null, url: speedrunUrl(r.id),
    videos: (r.videos?.links ?? []).map(l => webUrl(l.uri)).filter(Boolean), videoText: r.videos?.text ?? "",
    players: (r.players ?? []).flatMap(p => p.name || p.id || []), comment: r.comment ?? "",
  }])).values()];
  runs.sort((a, b) => (Date.parse(a.submitted ?? "") || Number.MAX_SAFE_INTEGER) -
    (Date.parse(b.submitted ?? "") || Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
  return {
    game: {id: gameId, name: "Rip It! Card Collector", url: gameUrl},
    checkedAt: new Date().toISOString(), truncated: page.pagination?.links?.some(l => l.rel === "next") ?? false, runs,
  };
}

export async function getQueue(): Promise<{queue: Queue; stale: boolean}> {
  try {
    const queue = await readLiveQueue();
    try {
      await db("run_lab_queue", {on_conflict: "key"}, "POST", {key: "rip-it", snapshot: queue}, "resolution=merge-duplicates,return=minimal");
    } catch (error) { console.error("Could not save queue snapshot", error); }
    return {queue, stale: false};
  } catch (error) {
    const [cached] = await db<{snapshot: Queue}[]>("run_lab_queue", {key: "eq.rip-it", select: "snapshot"});
    if (!cached) throw error;
    const queue = {...cached.snapshot, runs: cached.snapshot.runs.map(run => ({...run, url: speedrunUrl(run.id)}))};
    return {queue, stale: true};
  }
}

function recordingKey(value: string) {
  const url = new URL(value);
  const host = url.hostname.replace(/^(www|m)\./, "");
  const id = host === "youtu.be" ? url.pathname.split("/")[1] :
    ["youtube.com", "youtube-nocookie.com"].includes(host) ?
      url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1] : null;
  if (id) return `youtube:${id}`;
  url.hash = "";
  return url.href;
}

export function runFlags(run: Run, all: Run[]) {
  const flags = [];
  if (!run.videos.length) flags.push("Missing recording link");
  if (!run.submitted || !Number.isFinite(Date.parse(run.submitted))) flags.push("Missing or invalid submission date");
  if (run.seconds == null || !Number.isFinite(run.seconds) || run.seconds <= 0) flags.push("Missing or invalid submitted run time");
  const recordings = new Set(run.videos.map(recordingKey));
  if (all.some(other => other.category !== run.category && other.id !== run.id &&
    other.videos.some(link => recordings.has(recordingKey(link))))) flags.push("Recording also linked in another pending category");
  return flags;
}

export function formatTime(ms: number | null) {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "Unavailable";
  const whole = Math.round(ms);
  return `${Math.floor(whole / 3600000)}:${String(Math.floor(whole / 60000) % 60).padStart(2, "0")}:${String(Math.floor(whole / 1000) % 60).padStart(2, "0")}.${String(whole % 1000).padStart(3, "0")}`;
}

export async function readRun(id: string) {
  if (!isRunId(id)) throw new Error("Invalid run ID");
  const {data} = await upstream<SourceRun>(`runs/${id}`);
  if (data.game !== gameId || data.id !== id) throw new Error("Unexpected run");
  return data;
}

export async function isWorldRecord(run: SourceRun) {
  if (!isRunId(run.category)) throw new Error("Invalid category ID");
  const {data} = await upstream<{
    game: string; category: string; runs: {place: number; run: SourceRun}[];
  }>(`leaderboards/${gameId}/category/${run.category}`, {top: "1"});
  if (data.game !== gameId || data.category !== run.category || !Array.isArray(data.runs) ||
      !data.runs.length || data.runs.some(entry => entry?.place !== 1 || !isRunId(entry.run?.id))) {
    throw new Error("Speedrun.com returned an unexpected leaderboard");
  }
  return data.runs.length === 1 && data.runs[0].run.id === run.id;
}
