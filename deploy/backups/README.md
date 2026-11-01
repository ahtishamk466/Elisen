# Elisen server backups

Setup status (2026-11-01): active. Both server timers are enabled. Initial
production database (115 MB) and Jasper (705 MB) archives passed integrity
checks and server-to-Drive upload verification (zero differences). Google Cloud
project `tranquil-apogee-513418-p4` (Elisen Server Backups) supplies a dedicated
internal OAuth desktop client; refresh credentials are stored only on the server.
Drive folder: https://drive.google.com/drive/folders/1D6siNEGE89K54j-TW06d1a5uOgLzfqMf

Installed on `aqeel@154.53.38.1`; use the authorized old Mac RSA key
with `IdentitiesOnly=yes`, `IdentityAgent=none`, and `BatchMode=yes`.
Do not probe with other keys: fail2ban can block the client IP.

- Database: daily at 03:00 Asia/Karachi, production database named in
  `/var/www/tpms/tpms/config/db.php`, including routines, triggers and events.
- Jasper: first of each month at 03:30 Asia/Karachi. A Jasper `--everything`
  repository export, installation files and `/root/.jrsks` + `.jrsksp`.
  Tomcat temporary files, work and logs are excluded.
- Destination: existing Google Drive “Elisen Project” folder
  `1-6ZEDjeKP4ejbSua2lsqK27S5OAw8eGY`, under `Backups/database` and
  `Backups/jasper`. Drive backups are retained without automatic deletion.
- Local files: `/var/backups/elisen`, root-only. After successful upload
  verification, retain seven database archives and two Jasper archives.
- SHA-256 sidecars accompany every archive. Gzip and repository ZIP integrity
  are checked before upload; rclone verifies uploaded files afterward.
- Jobs share a lock; a conflicting run fails rather than making concurrent dumps.
  `Persistent=true` catches up after server downtime. Check failures in journald.

The server needs its own Drive authorization; the Codex connector cannot supply
credentials to a server job. Root-only rclone config lives at
`/etc/elisen-backup/rclone.conf`; never copy its contents into the repository,
chat, or logs. The remote `elisen-drive` is rooted at the folder above.

Install `elisen-backup` as `/usr/local/sbin/elisen-backup` (0700), and the
service/timers under `/etc/systemd/system` (0644). Requires system packages
`rclone`, MySQL client, PHP CLI, gzip, tar, unzip and flock.

Before enabling, run both modes with `--local-only`, configure Drive, upload
and verify those archives, then enable the timers:

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now elisen-database-backup.timer elisen-jasper-backup.timer
sudo systemctl list-timers 'elisen-*'
sudo journalctl -u 'elisen-backup@*' --since '7 days ago'
```

Backup creation/integrity verification is not a restore rehearsal. Restore only
into an isolated database/Jasper installation; never use production's restore UI
for testing. The database dump is transaction-consistent for InnoDB tables;
nontransactional tables and changes during the Jasper installation archive may
require a maintenance-window backup for a fully coordinated recovery point.
