import {ChannelType, Client, Events, GatewayIntentBits, Options, PermissionFlagsBits} from "discord.js";
import {pathToFileURL} from "node:url";

const eventNames = ["joins", "leaves", "deletions"];
const sendPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.EmbedLinks,
];

function readEvents(env, name) {
  const events = new Set((env[name] ?? "").split(",").map((value) => value.trim()).filter(Boolean));
  for (const event of events) {
    if (!eventNames.includes(event)) throw new Error(`${name} accepts ${eventNames.join(", ")}`);
  }
  return events;
}

function snowflake(value, name) {
  if (!/^\d{17,20}$/.test(value ?? "")) throw new Error(`${name} must be a Discord ID`);
  return value;
}

export function readConfig(env) {
  const events = readEvents(env, "DISCORD_STAFF_ACTIVITY_EVENTS");
  if (!events.size) return null;

  const pingEvents = readEvents(env, "DISCORD_STAFF_ACTIVITY_PING_EVENTS");
  for (const event of pingEvents) {
    if (!events.has(event)) throw new Error(`Enable ${event} in DISCORD_STAFF_ACTIVITY_EVENTS before turning on pings`);
  }
  const pingRoleIds = new Set();
  if (pingEvents.size) {
    for (const name of ["DISCORD_ADMIN_ROLE_ID", "DISCORD_MOD_ROLE_ID"]) {
      if (env[name]) pingRoleIds.add(snowflake(env[name], name));
    }
    if (!pingRoleIds.size) throw new Error("Set DISCORD_ADMIN_ROLE_ID or DISCORD_MOD_ROLE_ID to enable staff activity pings");
  }

  if (!env.DISCORD_BOT_TOKEN) throw new Error("Missing DISCORD_BOT_TOKEN");
  const guildId = snowflake(env.DISCORD_SERVER_ID, "DISCORD_SERVER_ID");
  if (pingRoleIds.has(guildId)) throw new Error("Staff activity pings require staff role IDs");
  return {
    events,
    pingEvents,
    pingRoleIds: [...pingRoleIds],
    guildId,
    logChannelId: snowflake(env.DISCORD_STAFF_ACTIVITY_LOG_ID, "DISCORD_STAFF_ACTIVITY_LOG_ID"),
    token: env.DISCORD_BOT_TOKEN,
  };
}

export function logChannel(client, config) {
  const channel = client.channels.cache.get(config.logChannelId);
  if (channel?.guildId !== config.guildId || channel.type !== ChannelType.GuildText) {
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

export function activityPost(client, config, packet, timestamp = new Date()) {
  const {t: event, d: data} = packet;
  if (data?.guild_id !== config.guildId) return;

  let kind, title, description;
  switch (event) {
    case "GUILD_MEMBER_ADD": {
      const member = client.guilds.cache.get(config.guildId)?.members.cache.get(data.user.id);
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
      if (channel?.guildId !== config.guildId || channel.type === ChannelType.PrivateThread ||
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

  if (!config.events.has(kind)) return;
  const roleIds = config.pingEvents.has(kind) ? config.pingRoleIds : [];
  return {
    ...(roleIds.length ? {content: roleIds.map((id) => `<@&${id}>`).join(" ")} : {}),
    embeds: [{title, description, timestamp: timestamp.toISOString()}],
    allowedMentions: {parse: [], roles: roleIds},
  };
}

async function start() {
  const config = readConfig(process.env);
  if (!config) {
    console.log("Staff activity logging is off. Set DISCORD_STAFF_ACTIVITY_EVENTS to enable it.");
    return;
  }

  const intents = [GatewayIntentBits.Guilds];
  if (config.events.has("joins") || config.events.has("leaves")) intents.push(GatewayIntentBits.GuildMembers);
  if (config.events.has("deletions")) intents.push(GatewayIntentBits.GuildMessages);
  const client = new Client({
    intents,
    makeCache: Options.cacheWithLimits({...Options.DefaultMakeCacheSettings, MessageManager: 0}),
  });
  let started = false;

  // Raw delete events include messages sent before this worker started.
  client.on(Events.Raw, async (packet) => {
    if (!started) return;
    try {
      const post = activityPost(client, config, packet);
      if (post) await logChannel(client, config).send(post);
    } catch (error) {
      console.error(`Could not post Discord staff activity: ${error.message}`);
    }
  });
  client.once(Events.ClientReady, () => {
    try {
      logChannel(client, config);
      started = true;
      console.log(`Discord staff activity logging is on for ${[...config.events].join(", ")}.`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
      void client.destroy();
    }
  });
  client.on(Events.Error, (error) => console.error(`Discord client error: ${error.message}`));
  client.on(Events.ShardError, (error) => console.error(`Discord connection error: ${error.message}`));
  client.on(Events.ShardDisconnect, ({code}) => {
    console.error(`Discord Gateway stopped with close code ${code}.`);
    process.exitCode = 1;
    void client.destroy();
  });

  for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => void client.destroy());

  try {
    await client.login(config.token);
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
