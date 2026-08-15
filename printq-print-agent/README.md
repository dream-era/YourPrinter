# YourPrinter Print Agent

The background service that runs on a shop's PC. When staff clicks
**"Start Printing"** in the dashboard, this is what actually sends the file
to the physical printer — no OS print dialog, no one standing at the
keyboard clicking through it.

## How it works

1. Polls `GET /api/agent/print-jobs/pending` every few seconds.
2. Claims a job (`POST .../ack`) so a restart mid-job can't double-print.
3. Downloads the file via a short-lived signed URL.
4. Prints it silently to the default (or configured) printer.
5. Reports success/failure back (`POST .../complete`). Failures retry up to
   3 times, then get flagged to the shop owner as needing attention.

## Setup

```bash
cd printq-print-agent
npm install
cp .env.example .env
```

Edit `.env`:
- `API_BASE_URL` — your deployed backend's URL
- `AGENT_KEY` — get this by having the shop owner call
  `POST /api/shops/{shopId}/agents` with `{"name": "Front counter PC"}`.
  **The key is shown exactly once in that response** — copy it into `.env`
  immediately, it can't be retrieved again (only revoked and reissued).
- `PRINTER_NAME` — optional, leave blank for system default

```bash
npm start
```

## Running as a background service (so it survives reboots)

**Windows** — easiest via [PM2](https://pm2.keymetrics.io/) or
[node-windows](https://github.com/coreybutler/node-windows):
```bash
npm install -g pm2
pm2 start src/index.js --name printq-agent
pm2 save
pm2-startup install   # registers PM2 itself to launch on boot
```

**Mac/Linux** — a simple systemd unit (Linux) or launchd plist (Mac) works
well; PM2 also works identically to the Windows instructions above if you'd
rather not maintain a native service file.

Example systemd unit (`/etc/systemd/system/printq-agent.service`):
```ini
[Unit]
Description=YourPrinter Print Agent
After=network.target

[Service]
WorkingDirectory=/opt/printq-print-agent
ExecStart=/usr/bin/node src/index.js
Restart=always
User=printq

[Install]
WantedBy=multi-user.target
```
Then: `sudo systemctl enable --now printq-agent`

## Current limitations (read before relying on this)

- **DOCX/PPTX/images all auto-print now**, on every platform. DOCX/PPTX and
  Windows images go through a LibreOffice headless conversion step first;
  Mac/Linux images print directly via CUPS (`lp`) without needing
  LibreOffice at all for that path. Either way, requires LibreOffice
  installed for the DOCX/PPTX/Windows-image path (free, one-time install:
  [libreoffice.org](https://www.libreoffice.org/download/download/)).
  Set `LIBREOFFICE_PATH` in `.env` if `soffice` isn't on your system PATH.
- **Color/duplex support is best-effort and driver-dependent.** The
  mapping in `src/print.js` sends reasonable flags on both Windows
  (Sumatra via pdf-to-printer) and Mac/Linux (CUPS via `lp`), but test
  against your actual shop printer before trusting it unattended —
  driver support for these flags varies a lot between printer models.
- **Binding and lamination are still physical steps a human does** after
  the pages print — there's no software equivalent for those.
- **One agent = one PC = one default printer.** If a shop has multiple
  printers they want to route jobs to differently, that's not built —
  everything currently goes to the configured/default printer.

## Relationship to 24/7 Autoprint

This is the same piece your Phase 2 autoprint design already called for —
an installed agent with a proven reliability record is exactly the
prerequisite you outlined. The only difference between "staff manually
clicks Start Printing" (this) and true unattended overnight autoprint is
*what triggers the job* — the polling loop and printing logic here don't
need to change, only when/how jobs get queued.
