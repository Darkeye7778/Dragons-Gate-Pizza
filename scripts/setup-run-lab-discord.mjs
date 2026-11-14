import {activityEvents, activityModes} from "../src/lib/run-lab/staff-activity.mjs";

const mode = process.argv[2];
if (!["commands", "panels"].includes(mode)) throw new Error("Use commands or panels");
const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};
const token = required("DISCORD_BOT_TOKEN");
const app = required("DISCORD_APP_ID");
const guild = required("DISCORD_SERVER_ID");
const api = "https://discord.com/api/v10";

async function send(path, payload) {
  const response = await fetch(api + path, {
    method: "POST", signal: AbortSignal.timeout(10000),
    headers: {Authorization: `Bot ${token}`, "Content-Type": "application/json"},
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Discord setup returned HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
  return response.json();
}

if (mode === "commands") {
  const path = `/applications/${app}/guilds/${guild}/commands`;
  await send(path, {
    name: "review", description: "Review the oldest pending run or open a specific pending run",
    options: [{type: 3, name: "run", description: "Optional Speedrun.com run ID"}],
  });
  await send(path, {
    name: "list", description: "Browse a Run Lab queue",
    options: [
      {type: 1, name: "runs", description: "List runs awaiting verification"},
      {type: 1, name: "tickets", description: "Browse open support tickets and appeals"},
    ],
  });
  await send(path, {
    name: "ticket", description: "Manage the ticket you claimed",
    options: [{type: 1, name: "add", description: "Add someone to this ticket", options: [
      {type: 6, name: "member", description: "Server member to give access", required: true},
    ]}],
  });
  await send(path, {
    name: "staff-log", description: "Configure Auto Mod's private server activity log",
    default_member_permissions: "32",
    options: [
      {type: 1, name: "status", description: "Show the current logging settings"},
      {type: 1, name: "channel", description: "Choose the private staff log channel", options: [
        {type: 7, name: "destination", description: "Private text channel", channel_types: [0], required: true},
      ]},
      {type: 1, name: "event", description: "Turn logging or staff pings on or off for an event", options: [
        {type: 3, name: "event", description: "Activity to configure", choices: activityEvents, required: true},
        {type: 3, name: "mode", description: "Off, log quietly, or log and ping", choices: activityModes, required: true},
      ]},
      {type: 1, name: "roles", description: "Set up to two ping roles, or leave both blank to clear them", options: [
        {type: 8, name: "role", description: "First staff role"},
        {type: 8, name: "second-role", description: "Second staff role"},
      ]},
    ],
  });
  console.log("Registered /review, /list runs, /list tickets, /ticket add, and /staff-log in the server.");
} else {
  for (const panel of [
    {kind: "appeal", channel: required("DISCORD_APPEAL_PANEL_ID"), label: "Open an Appeal",
      description: "Ask the moderators to take another look at a Speedrun.com run decision. Have the run link and any relevant timestamps ready."},
    {kind: "support", channel: required("DISCORD_SUPPORT_PANEL_ID"), label: "Open a Ticket",
      description: "Open a private channel to ask the moderators a question or report an issue."},
  ]) {
    const message = await send(`/channels/${panel.channel}/messages`, {
      embeds: [{title: panel.label, description: panel.description, color: 0x8259d5}],
      components: [{type: 1, components: [{type: 2, style: 1, custom_id: `intake:${panel.kind}`, label: panel.label}]}],
      allowed_mentions: {parse: []},
    });
    console.log(`${panel.label}: https://discord.com/channels/${guild}/${panel.channel}/${message.id}`);
  }
}
