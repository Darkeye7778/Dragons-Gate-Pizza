export const gameId = "j1npmkx6";
export const discordApi = "https://discord.com/api/v10";

export function setting(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function origin(): string {
  return new URL(setting("RUN_LAB_ORIGIN")).origin;
}

export function isId(value: unknown): value is string {
  return typeof value === "string" && /^\d{16,22}$/.test(value);
}

export function staffRoleIds() {
  return [...new Set([setting("DISCORD_MOD_ROLE_ID"), process.env.DISCORD_ADMIN_ROLE_ID].filter(isId))];
}

export function isRunId(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]{8}$/i.test(value);
}

export async function discord<T>(path: string, method = "GET", body?: object): Promise<T> {
  const response = await fetch(discordApi + path, {
    method, cache: "no-store", signal: AbortSignal.timeout(9000),
    headers: { Authorization: `Bot ${setting("DISCORD_BOT_TOKEN")}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) throw new Error(`Discord API returned ${response.status} for ${method} ${path.replace(/\d{16,22}/g, ":id")}`);
  return response.status === 204 ? undefined as T : await response.json();
}
