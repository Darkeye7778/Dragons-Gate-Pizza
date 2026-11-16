# Auto Mod Boss — Discord moderation tooling

Auto Mod Boss provides Discord-based review commands, private tickets and appeals, run notifications, and configurable staff activity logs. The retired Run Lab website and its browser-based video/frame-review tools are **not included**.

The Discord interactions route is `/api/discord/interactions`. The polling endpoint remains at `/api/run-lab/poll` **for compatibility with existing scheduled jobs**; that endpoint is backend-only and is not a Run Lab website.

## Set up

1. Install a Discord application using `bot` and `applications.commands` scopes. Grant the bot appropriate permissions in staff and ticket channels: Manage Channels, Manage Roles, View Channel, Send Messages, Embed Links, Attach Files, and Read Message History. Enable Message Content and Server Members privileged gateway intents for transcript and join/leave features.
2. Apply the Supabase migrations, in order:
   - `supabase/migrations/20261112000000_run_lab.sql`
   - `supabase/migrations/20261112000001_run_lab_ticket_archive.sql`
   - `supabase/migrations/20261114000000_discord_staff_activity.sql`
3. Set server-side environment variables on the deployed Next.js app:
   - `DISCORD_APP_ID`, `DISCORD_PUBLIC_KEY`, `DISCORD_BOT_TOKEN`, `DISCORD_SERVER_ID`, `DISCORD_MOD_ROLE_ID`
   - `DISCORD_OPEN_TICKETS_CATEGORY_ID`, `DISCORD_APPEAL_PANEL_ID`, `DISCORD_SUPPORT_PANEL_ID`, `DISCORD_RUN_REVIEW_ID`, `DISCORD_TICKET_TRACKER_ID`, `DISCORD_MOD_LOG_ID`, `DISCORD_PENDING_RUNS_ID`, `DISCORD_VERIFIED_RUNS_ID`
   - Optional: `DISCORD_ADMIN_ROLE_ID`, `DISCORD_TICKET_LOGS_ID`, `DISCORD_NEW_RUNS_ROLE_ID`, `DISCORD_WR_UPDATES_ROLE_ID`
   - Storage: `RUN_LAB_SUPABASE_URL`, `RUN_LAB_SUPABASE_KEY` (legacy backend variable names retained)
   - Poll authentication: `RUN_LAB_POLL_SECRET` (strong random secret; do not commit)
4. Set the application's Interactions Endpoint URL to `https://<your-domain>/api/discord/interactions`.
5. Register slash commands and initial panels:

   ```sh
   node --env-file=.env.local scripts/setup-auto-mod-discord.mjs commands
   node --env-file=.env.local scripts/setup-auto-mod-discord.mjs panels
   ```

   Rerunning `panels` creates additional panel messages.
6. Schedule a Supabase Cron HTTP **POST** to `https://<your-domain>/api/run-lab/poll` with `Authorization: Bearer <RUN_LAB_POLL_SECRET>`. Keep the secret in Supabase Vault. This posts new pending and verified run notifications without duplicates.
7. Run `npm run start:discord-staff-activity` on an **always-on Node.js host** for join/leave/deletion events; set `DISCORD_BOT_TOKEN`, `RUN_LAB_SUPABASE_URL`, and `RUN_LAB_SUPABASE_KEY` on that host. Serverless web hosting alone cannot run this listener continuously.

## Discord workflow

- `/review` and `/list runs` browse Speedrun.com submissions and show links within Discord.
- Ticket/appeal panels create private channels. Staff can claim, add participants with `/ticket add`, view `/list tickets`, close cases, and read archived transcripts.
- `/staff-log channel`, `/staff-log event`, `/staff-log roles`, and `/staff-log status` configure per-server logging for joins, departures, and deletions. The destination must be private.
- The poller announces pending submissions, verified runs, and sole first-place records with configured role mentions.

## Safety and rollout

Keep tokens and Supabase service keys server-side. Test on a noncritical Discord server/channel before going live. Deletion events do not supply message text or moderator identity. The browser Run Lab, OAuth routes, frame scan, and report-writing endpoints have been removed. SQL table and backend route names that still contain `run_lab` are retained to avoid breaking storage and existing cron configuration.
