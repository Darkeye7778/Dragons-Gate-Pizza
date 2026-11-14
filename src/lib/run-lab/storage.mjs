export async function requestStorage(env, table, query = {}, method = "GET", body, prefer = "return=representation") {
  const {RUN_LAB_SUPABASE_URL: baseUrl, RUN_LAB_SUPABASE_KEY: key} = env;
  if (!baseUrl || !key) throw new Error("Missing Run Lab Supabase settings");
  const url = new URL(`/rest/v1/${table}`, baseUrl);
  url.search = new URLSearchParams(query).toString();
  const response = await fetch(url, {
    method, cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: {apikey: key, ...(key.startsWith("eyJ") ? {Authorization: `Bearer ${key}`} : {}), "Content-Type": "application/json", Prefer: prefer},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Run Lab storage returned HTTP ${response.status} for ${table}`);
  if (response.status === 204 || prefer.split(",").some(value => value.trim() === "return=minimal")) return;
  return response.json();
}
