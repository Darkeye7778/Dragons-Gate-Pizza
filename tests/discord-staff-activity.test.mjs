import assert from "node:assert/strict";
import {test} from "node:test";
import {ChannelType, PermissionFlagsBits, PermissionsBitField} from "discord.js";
import {activityPost, describeActivity, logChannel} from "../scripts/discord-staff-activity.mjs";
import {getStaffActivity, setStaffActivity} from "../src/lib/run-lab/staff-activity.mjs";

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
const settings = {
  guild_id: guildId,
  channel_id: logId,
  joins: "log",
  leaves: "log",
  deletions: "ping",
  ping_role_ids: [adminId, modId],
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

test("event mode controls whether a log posts and can ping only the configured roles", () => {
  const activity = describeActivity(mockClient(), packet("MESSAGE_DELETE", {id: messageId, channel_id: publicId}), time);
  assert.equal(activityPost({...settings, deletions: "off"}, activity), undefined);
  assert.equal(activityPost({...settings, channel_id: null}, activity), undefined);
  assert.equal(activityPost({...settings, guild_id: "100000000000000099"}, activity), undefined);
  assert.deepEqual(activityPost({...settings, ping_role_ids: []}, activity).allowedMentions, {parse: [], roles: []});
  assert.deepEqual(activityPost({...settings, deletions: "log"}, activity).allowedMentions, {parse: [], roles: []});
  assert.deepEqual(activityPost(settings, activity).allowedMentions, {parse: [], roles: [adminId, modId]});
});

test("member events honor opt-in and avoid a repeat join for a cached member", () => {
  const client = mockClient();
  const join = packet("GUILD_MEMBER_ADD", {user: {id: userId}, joined_at: joinedAt});
  assert.equal(describeActivity(client, join, time).embed.title, "Member joined");
  const departure = packet("GUILD_MEMBER_REMOVE", {user: {id: userId}});
  assert.equal(describeActivity(client, departure, time).embed.title, "Member left the server");
  assert.equal(describeActivity(client, {...departure, d: {...departure.d, guild_id: "different server"}}, time), undefined);

  client.guilds.cache.get(guildId).members.cache.set(userId, {joinedTimestamp: time.getTime()});
  assert.equal(describeActivity(client, join, time), undefined);
});

test("deletions include uncached messages and exclude private channels", () => {
  const client = mockClient();
  const deletion = (channelId) => packet("MESSAGE_DELETE", {id: messageId, channel_id: channelId});
  assert.match(describeActivity(client, deletion(publicId), time).embed.description, new RegExp(messageId));
  assert.equal(describeActivity(client, deletion(privateId), time), undefined);
  assert.equal(describeActivity(client, deletion(threadId), time), undefined);
  assert.equal(describeActivity(client, packet("MESSAGE_DELETE_BULK", {channel_id: publicId, ids: [1, 2]}), time).embed.title, "2 messages deleted");
});

test("the destination must remain private", () => {
  const client = mockClient();
  assert.equal(logChannel(client, settings), client.channels.cache.get(logId));
  assert.throws(() => logChannel(client, {...settings, channel_id: publicId}), /Deny View Channel/);
});

test("storage defaults to off and updates only the selected setting for the given server", async (t) => {
  const env = {RUN_LAB_SUPABASE_URL: "https://example.invalid", RUN_LAB_SUPABASE_KEY: "mock-key"};
  t.mock.method(globalThis, "fetch", async (url, request) => {
    if (request.method === "GET") {
      assert.equal(url.searchParams.get("guild_id"), `eq.${guildId}`);
      return Response.json([]);
    }
    assert.equal(request.method, "POST");
    assert.equal(url.searchParams.get("on_conflict"), "guild_id");
    assert.deepEqual(JSON.parse(request.body), {guild_id: guildId, deletions: "ping"});
    return Response.json([settings]);
  });
  assert.equal((await getStaffActivity(guildId, env)).joins, "off");
  assert.deepEqual(await setStaffActivity(guildId, {deletions: "ping"}, env), settings);
});
