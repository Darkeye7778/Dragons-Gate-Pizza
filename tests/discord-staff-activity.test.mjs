import assert from "node:assert/strict";
import {test} from "node:test";
import {ChannelType, PermissionFlagsBits, PermissionsBitField} from "discord.js";
import {activityPost, logChannel, readConfig} from "../scripts/discord-staff-activity.mjs";

const guildId = "100000000000000001";
const logId = "100000000000000002";
const publicId = "100000000000000003";
const privateId = "100000000000000004";
const messageId = "100000000000000005";
const userId = "100000000000000006";
const modId = "100000000000000007";
const adminId = "100000000000000008";
const threadId = "100000000000000009";
const joinedAt = "2026-11-14T12:00:00.000Z";
const time = new Date(joinedAt);
const env = {
  DISCORD_SERVER_ID: guildId,
  DISCORD_BOT_TOKEN: "test-token",
  DISCORD_STAFF_ACTIVITY_LOG_ID: logId,
  DISCORD_STAFF_ACTIVITY_EVENTS: "joins, leaves, deletions",
  DISCORD_ADMIN_ROLE_ID: adminId,
  DISCORD_MOD_ROLE_ID: modId,
};

function mockClient() {
  const guild = {roles: {everyone: {id: guildId}}, members: {cache: new Map()}};
  const channel = (type, publicView) => ({
    guildId, guild, type,
    permissionsFor(role) {
      if (role !== guild.roles.everyone) return new PermissionsBitField(PermissionsBitField.All);
      return new PermissionsBitField(publicView ? PermissionFlagsBits.ViewChannel : 0n);
    },
  });
  return {
    user: {id: "bot"},
    guilds: {cache: new Map([[guildId, guild]])},
    channels: {cache: new Map([
      [logId, channel(ChannelType.GuildText, false)],
      [publicId, channel(ChannelType.GuildText, true)],
      [privateId, channel(ChannelType.GuildText, false)],
      [threadId, channel(ChannelType.PrivateThread, true)],
    ])},
  };
}

const packet = (t, fields) => ({t, d: {guild_id: guildId, ...fields}});

test("logging is optional and staff pings require an enabled event and a staff role", () => {
  assert.equal(readConfig({}), null);
  assert.throws(() => readConfig({...env, DISCORD_STAFF_ACTIVITY_EVENTS: "joins", DISCORD_STAFF_ACTIVITY_PING_EVENTS: "leaves"}), /Enable leaves/);
  assert.throws(() => readConfig({...env, DISCORD_STAFF_ACTIVITY_PING_EVENTS: "joins", DISCORD_ADMIN_ROLE_ID: guildId}), /staff role IDs/);
});

test("member events honor opt-in and avoid a repeat join for a cached member", () => {
  const client = mockClient();
  const config = readConfig({...env, DISCORD_STAFF_ACTIVITY_EVENTS: "joins"});
  const join = packet("GUILD_MEMBER_ADD", {user: {id: userId}, joined_at: joinedAt});
  assert.equal(activityPost(client, config, join, time).embeds[0].title, "Member joined");
  assert.equal(activityPost(client, config, packet("GUILD_MEMBER_REMOVE", {user: {id: userId}}), time), undefined);

  client.guilds.cache.get(guildId).members.cache.set(userId, {joinedTimestamp: time.getTime()});
  assert.equal(activityPost(client, config, join, time), undefined);
});

test("deletions include uncached messages, exclude private channels, and only ping configured roles", () => {
  const client = mockClient();
  const config = readConfig({...env, DISCORD_STAFF_ACTIVITY_PING_EVENTS: "deletions"});
  const deletion = (channelId) => packet("MESSAGE_DELETE", {id: messageId, channel_id: channelId});
  const post = activityPost(client, config, deletion(publicId), time);
  assert.match(post.embeds[0].description, new RegExp(messageId));
  assert.deepEqual(post.allowedMentions, {parse: [], roles: [adminId, modId]});
  assert.equal(activityPost(client, config, deletion(privateId), time), undefined);
  assert.equal(activityPost(client, config, deletion(threadId), time), undefined);
  assert.equal(activityPost(client, config, packet("MESSAGE_DELETE_BULK", {channel_id: publicId, ids: [1, 2]}), time).embeds[0].title, "2 messages deleted");

  const departure = packet("GUILD_MEMBER_REMOVE", {user: {id: userId}});
  assert.deepEqual(activityPost(client, config, departure, time).allowedMentions, {parse: [], roles: []});
  assert.equal(activityPost(client, config, {...departure, d: {...departure.d, guild_id: "different server"}}, time), undefined);
});

test("the destination must remain private", () => {
  const client = mockClient();
  const config = readConfig(env);
  assert.equal(logChannel(client, config), client.channels.cache.get(logId));
  assert.throws(() => logChannel(client, {...config, logChannelId: publicId}), /Deny View Channel/);
});
