import { setting } from "./config";

export type Ticket = {
  id: string;
  kind: "appeal" | "support";
  opener: string;
  run_id: string | null;
  detail: string;
  channel_id: string | null;
  tracker_id: string | null;
  claimed_by: string | null;
  closed_at: string | null;
  outcome: string | null;
  created_at: string;
};

export const ticketFields = "id,kind,opener,run_id,detail,channel_id,tracker_id,claimed_by,closed_at,outcome,created_at";

export async function db<T>(table: string, query: Record<string, string> = {}, method = "GET", body?: object, prefer = "return=representation"): Promise<T> {
  const url = new URL(`/rest/v1/${table}`, setting("RUN_LAB_SUPABASE_URL"));
  url.search = new URLSearchParams(query).toString();
  const key = setting("RUN_LAB_SUPABASE_KEY");
  const response = await fetch(url, {
    method, cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { apikey: key, ...(key.startsWith("eyJ") ? {Authorization: `Bearer ${key}`} : {}), "Content-Type": "application/json", Prefer: prefer },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Run Lab storage returned HTTP ${response.status} for ${table}`);
  if (response.status === 204 || prefer.split(",").some(value => value.trim() === "return=minimal")) {
    return undefined as T;
  }
  return response.json();
}

export async function ticket(id: string) {
  return (await db<Ticket[]>("run_lab_tickets", { id: `eq.${id}`, select: ticketFields }))[0];
}

export async function openTickets() {
  return db<Ticket[]>("run_lab_tickets", {
    closed_at: "is.null", channel_id: "not.is.null", select: ticketFields, order: "created_at.asc,id.asc", limit: "1000",
  });
}
