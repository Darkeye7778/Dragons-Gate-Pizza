import {requestStorage} from "./storage.mjs";

export const activityEvents = [
  {name: "Member joins", value: "joins"},
  {name: "Member departures", value: "leaves"},
  {name: "Message deletions", value: "deletions"},
];
export const activityModes = [
  {name: "Off", value: "off"},
  {name: "Log quietly", value: "log"},
  {name: "Log and ping staff", value: "ping"},
];

const table = "discord_staff_activity_settings";

export async function getStaffActivity(guildId, env = process.env) {
  const rows = await requestStorage(env, table, {guild_id: `eq.${guildId}`});
  return rows[0] ?? {guild_id: guildId, channel_id: null, ping_role_ids: [], joins: "off", leaves: "off", deletions: "off"};
}

export async function setStaffActivity(guildId, changes, env = process.env) {
  const rows = await requestStorage(env, table, {on_conflict: "guild_id"}, "POST",
    {...changes, guild_id: guildId}, "resolution=merge-duplicates,missing=default,return=representation");
  return rows[0];
}
