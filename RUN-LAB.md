# Rip It! Run Lab on DGP

The private dashboard is at `/run-lab`. Discord sends slash commands, button clicks, and form submissions to `/api/discord/interactions`. The app responds through Discord and uses the bot account to create channels and send notifications. A member needs the configured moderator role to sign in to the site and use staff commands.

## Set up the services

1. Create the Discord app and install it in the Rip It! server with the `bot` and `applications.commands` scopes. Give the bot **Manage Channels** and **Manage Roles** for ticket channels and permission edits. It also needs **View Channel**, **Send Messages**, **Embed Links**, **Attach Files**, and **Read Message History** in the relevant channels. Give its bot role access to the private staff channels it posts to and the **Open Tickets** category. Keep **Open Tickets** hidden from ordinary members by default.
2. Apply [the SQL migration](supabase/migrations/20261112000000_run_lab.sql) to the Supabase project. It creates the ticket, report, queue snapshot, and notification tables. Browser clients never receive the Supabase server key.
3. Set these server environment variables in the DGP Vercel project and deploy. For local use, put the same variables in the ignored `.env.local` file.

| Variable | Value |
|---|---|
| `RUN_LAB_ORIGIN` | Exact deployment origin, for example `https://dragons-gate-pizza.vercel.app` |
| `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY` | Discord Developer Portal, General Information |
| `DISCORD_CLIENT_SECRET` | Discord Developer Portal, OAuth2 |
| `DISCORD_BOT_TOKEN` | Discord Developer Portal, Bot |
| `DISCORD_SERVER_ID`, `DISCORD_MOD_ROLE_ID` | Server ID and Moderator role ID |
| `DISCORD_OPEN_TICKETS_CATEGORY_ID` | Open Tickets category ID |
| `DISCORD_APPEAL_PANEL_ID`, `DISCORD_SUPPORT_PANEL_ID` | `#submit-an-appeal` and `#submit-a-ticket` |
| `DISCORD_RUN_REVIEW_ID`, `DISCORD_TICKET_TRACKER_ID` | `#run-review` and `#ticket-tracker` |
| `DISCORD_MOD_LOG_ID`, `DISCORD_PENDING_RUNS_ID`, `DISCORD_VERIFIED_RUNS_ID` | `#mod-log`, `#new-pending-runs`, and `#verified-runs` |
| `RUN_LAB_SUPABASE_URL`, `RUN_LAB_SUPABASE_KEY` | Supabase project URL and server secret key |
| `RUN_LAB_SESSION_SECRET`, `RUN_LAB_POLL_SECRET` | Two independently generated random secrets. Run `openssl rand -hex 32` twice |

4. In the Discord Developer Portal set **Interactions Endpoint URL** to `<origin>/api/discord/interactions` and add `<origin>/api/run-lab/callback` under **OAuth2 → Redirects**. The interactions URL must be reachable by Discord and answer its signed test request. If Vercel Deployment Protection is on for the test deployment, Discord needs a reachable deployment.
5. With `.env.local` set, run these commands from the repo root. Run `panels` once for the initial setup. Rerunning it sends new panel messages.

   ```sh
   node --env-file=.env.local scripts/setup-run-lab-discord.mjs commands
   node --env-file=.env.local scripts/setup-run-lab-discord.mjs panels
   ```

6. In Supabase Cron, schedule an HTTP **POST** to `<origin>/api/run-lab/poll` hourly with `Authorization: Bearer <RUN_LAB_POLL_SECRET>`. Keep the secret in Supabase Vault for a SQL-scheduled job. A failed refresh returns an error and sends no alerts. The verified feed follows runs the bot previously saw pending and confirms their status with Speedrun.com.

## Test it in Discord

- In `#run-review`, use `/review` to open the oldest pending run, optionally supply a run ID, or use `/list runs`. Arrow buttons edit the same embed. The reply is visible to the staff channel. If the source is down, the last successful queue is labeled with its refresh time.
- As a regular member, open an appeal. Confirm a second regular member cannot see it. Use Claim in `#ticket-tracker` as a mod, then use `/list tickets` to browse open items. Close the appeal with an outcome and confirm the tracker changes, the opener’s channel becomes read-only, and the result is posted to `#mod-log`. Closed channels retain the conversation and the database stores a staff-side transcript.
- Open `/run-lab` and sign in with a moderator account. Check that a regular member is denied. Play the recording embed or open a local video. Run the frame precheck and confirm the estimated frames show up for a second moderator and in the Discord review card.

## Move existing Run Lab data

The original Site stores attempts and settings per browser. In the same browser profile where you used it, open the original Run Lab, open Developer Tools → Console, and run this to download your metadata locally. Run it on the original Run Lab page only.

```js
const key = "rip-it-run-lab-v1";
const backup = {
  workspace: JSON.parse(localStorage.getItem(key)) ?? { runs: [], submissions: [], rules: {} },
  moderation: JSON.parse(localStorage.getItem(key + "-moderation"))
};
const url = URL.createObjectURL(new Blob([JSON.stringify(backup)], { type: "application/json" }));
const download = Object.assign(document.createElement("a"), { href: url, download: "run-lab-backup.json" });
download.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

On DGP’s Run Lab, use **Import backup**. This transfers metadata, timing rules, and locally saved frame references and reports. Reattach any local footage files from your device. The frame scan runs in the browser and only its result is shared. The existing private Site and email watch can keep working during the cutover.
