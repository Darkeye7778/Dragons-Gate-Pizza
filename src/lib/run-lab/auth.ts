import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { discord, isId, origin, setting, staffRoleIds } from "./config";

export const sessionName = "run_lab_session";
export const stateName = "run_lab_oauth";
const hours = 8;

export function cookieOptions(maxAge: number) {
  return { httpOnly: true, sameSite: "lax" as const, secure: origin().startsWith("https:"), path: "/", maxAge };
}

function sign(value: string) {
  return createHmac("sha256", setting("RUN_LAB_SESSION_SECRET")).update(value).digest("base64url");
}

export function stateToken() { return randomBytes(32).toString("base64url"); }

export function makeSession(id: string) {
  const value = `${id}.${Date.now() + hours * 3600000}`;
  return {value: `${value}.${sign(value)}`, maxAge: hours * 3600};
}

export async function sessionUser() {
  const cookie = (await cookies()).get(sessionName)?.value;
  if (!cookie) return null;
  const [id, expires, digest, extra] = cookie.split(".");
  if (extra !== undefined || !isId(id) || !/^\d{13}$/.test(expires ?? "") || Number(expires) < Date.now() ||
      !/^[A-Za-z0-9_-]{43}$/.test(digest ?? "")) return null;
  return timingSafeEqual(Buffer.from(digest), Buffer.from(sign(`${id}.${expires}`))) ? id : null;
}

export function isModerator(roles?: string[]) {
  return staffRoleIds().some(role => roles?.includes(role));
}

export async function moderator() {
  const user = await sessionUser();
  if (!user) return null;
  try {
    const member = await discord<{roles: string[]}>(`/guilds/${setting("DISCORD_SERVER_ID")}/members/${user}`);
    return isModerator(member.roles) ? user : null;
  } catch (error) {
    console.error("Run Lab role verification failed", error);
    return null;
  }
}
