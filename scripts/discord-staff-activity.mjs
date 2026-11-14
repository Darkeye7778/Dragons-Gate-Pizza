import {ChannelType, Client, Events, GatewayIntentBits, Options, PermissionFlagsBits} from "discord.js";
import {pathToFileURL} from "node:url";
import {getStaffActivity} from "../src/lib/run-lab/staff-activity.mjs";

const settingsLifetimeMs = 10_000;
const sendPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
];

export function logChannel(client, settings) {
  const channel = client.channels.cache.get(settings.channel_id);
  if (channel?.guildId !== settings.guild_id || channel.type !== ChannelType.GuildText) {
    throw new Error("The staff activity log must be a text channel in the configured server");
  }
  const everyonePermissions = channel.permissionsFor(channel.guild.roles.everyone);
  if (!everyonePermissions || everyonePermissions.has(PermissionFlagsBits.ViewChannel)) {
    throw new Error("Deny View Channel for @everyone in the staff activity log");
  }
  if (!channel.permissionsFor(client.user.id)?.has(sendPermissions)) {
    throw new Error("Auto Mod needs View Channel, Send Messages, and Embed Links in the staff activity log");
  }
  return channel;
}

export function describeActivity(client, packet, timestamp = new Date()) {
  const {t: event, d: data} = packet;
  const guildId = data?.guild_id;
  if (!guildId || !client.guilds.cache.has(guildId)) return;

  let kind, title, description;
  switch (event) {
    case "GUILD_MEMBER_ADD": {
      const member = client.guilds.cache.get(guildId).members.cache.get(data.user.id);
      if (member?.joinedTimestamp === Date.parse(data.joined_at)) return;
      kind = "joins";
      title = "Member joined";
      description = `<@${data.user.id}> · User ID \`${data.user.id}\``;
      break;
    }
    case "GUILD_MEMBER_REMOVE":
      kind = "leaves";
      title = "Member left the server";
      description = `<@${data.user.id}> · User ID \`${data.user.id}\``;
      break;
    case "MESSAGE_DELETE":
    case "MESSAGE_DELETE_BULK": {
      const channel = client.channels.cache.get(data.channel_id);
      if (channel?.guildId !== guildId || channel.type === ChannelType.PrivateThread ||
          !channel.permissionsFor(channel.guild.roles.everyone)?.has(PermissionFlagsBits.ViewChannel)) return;
      kind = "deletions";
      title = event === "MESSAGE_DELETE" ? "Message deleted" : `${data.ids.length} messages deleted`;
      description = event === "MESSAGE_DELETE"
        ? `In <#${data.channel_id}> · Message ID \`${data.id}\``
        : `In <#${data.channel_id}>`;
      break;
    }
    default:
      return;
  }

  return {guildId, kind, embed: {title, description, timestamp: timestamp.toISOString()}};
}

export function activityPost(settings, activity) {
  if (activity.guildId !== settings.guild_id || !settings.channel_id) return;
  const mode = settings[activity.kind];
  if (mode !== "log" && mode !== "ping") return;
  const roleIds = mode === "ping" ? settings.ping_role_ids : [];
  return {
    ...(roleIds.length ? {content: roleIds.map((id) => `<@&${id}>`).join(" ")} : {}),
    embeds: [activity.embed],
    allowedMentions: {parse: [], roles: roleIds},
  };
}

async function start() {
  for (const name of ["DISCORD_BOT_TOKEN", "RUN_LAB_SUPABASE_URL", "RUN_LAB_SUPABASE_KEY"]) {
    if (!process.env[name]) throw new Error(`Missing ${name}`);
  }

  const cache = new Map();
  function settingsFor(guildId) {
    const entry = cache.get(guildId);
    if (entry && entry.expires > Date.now()) return entry.settings;
    const settings = getStaffActivity(guildId);
    cache.set(guildId, {settings, expires: Date.now() + settingsLifetimeMs});
    return settings;
  }

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages],
    makeCache: Options.cacheWithLimits({...Options.DefaultMakeCacheSettings, MessageManager: 0}),
  });
  let started = false;

  // Raw delete events include messages sent before this worker started.
  client.on(Events.Raw, async (packet) => {
    if (!started) return;
    try {
      const activity = describeActivity(client, packet);
      if (!activity) return;
      const settings = await settingsFor(activity.guildId);
      const post = activityPost(settings, activity);
      if (post) await logChannel(client, settings).send(post);
    } catch (error) {
      console.error(`Could not post Discord staff activity: ${error.message}`);
    }
  });
  client.once(Events.ClientReady, () => {
    started = true;
    console.log("Discord staff activity listener connected. Use /staff-log to configure it.");
  });
  client.on(Events.GuildDelete, (guild) => cache.delete(guild.id));
  client.on(Events.Error, (error) => console.error(`Discord client error: ${error.message}`));
  client.on(Events.ShardError, (error) => console.error(`Discord connection error: ${error.message}`));
  client.on(Events.ShardDisconnect, ({code}) => {
    console.error(`Discord Gateway stopped with close code ${code}.`);
    process.exitCode = 1;
    void client.destroy();
  });

  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => void client.destroy());

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    await client.destroy();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  start().catch((error) => {
    console.error(`Could not start Discord staff activity logging: ${error.message}`);
    process.exitCode = 1;
  });
}
