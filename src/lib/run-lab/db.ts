import {requestStorage} from "./storage.mjs";

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
  archive_url: string | null;
  close_notice_id: string | null;
  outcome: string | null;
  created_at: string;
};

export const ticketFields = "id,kind,opener,run_id,detail,channel_id,tracker_id,claimed_by,closed_at,archive_url,close_notice_id,outcome,created_at";

export async function db<T>(table: string, query: Record<string, string> = {}, method = "GET", body?: object, prefer = "return=representation"): Promise<T> {
  return requestStorage(process.env, table, query, method, body, prefer) as Promise<T>;
}

export async function ticket(id: string) {
  return (await db<Ticket[]>("run_lab_tickets", { id: `eq.${id}`, select: ticketFields }))[0];
}

export async function ticketForChannel(channelId: string) {
  return (await db<Ticket[]>("run_lab_tickets", { channel_id: `eq.${channelId}`, select: ticketFields }))[0];
}

export async function openTickets() {
  return db<Ticket[]>("run_lab_tickets", {
    closed_at: "is.null", channel_id: "not.is.null", select: ticketFields, order: "created_at.asc,id.asc", limit: "1000",
  });
}
