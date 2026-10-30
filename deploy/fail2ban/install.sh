#!/bin/sh
# Installs the GitHub Actions exemption for fail2ban's sshd jail on the
# TPMS V2 server, lifts any current bans on GitHub runner IPs, and prints the
# result. Run from the repo root on a machine whose key `aqeel` accepts:
#   sh deploy/fail2ban/install.sh [path/to/ssh/key]
set -eu
KEY=${1:-"$HOME/.ssh/id_rsa"}
HOST=aqeel@154.53.38.1
DIR=$(dirname "$0")

# "$KEY" stays quoted in each call: key paths can contain spaces.
scp -i "$KEY" -o IdentitiesOnly=yes "$DIR/f2b-is-github-actions" "$DIR/f2b-github-actions-refresh" \
  "$DIR/github-actions.local" "$DIR/f2b-github-actions.cron" "$HOST:/tmp/"
ssh -i "$KEY" -o IdentitiesOnly=yes "$HOST" 'set -e; cd /tmp
  sudo install -m 755 f2b-is-github-actions f2b-github-actions-refresh /usr/local/sbin/
  sudo install -m 644 github-actions.local /etc/fail2ban/jail.d/github-actions.local
  sudo install -m 644 f2b-github-actions.cron /etc/cron.d/f2b-github-actions
  rm -f f2b-is-github-actions f2b-github-actions-refresh github-actions.local f2b-github-actions.cron
  sudo /usr/local/sbin/f2b-github-actions-refresh
  sudo fail2ban-client reload sshd
  echo "ignorecommand: $(sudo fail2ban-client get sshd ignorecommand)"
  echo "GitHub ranges: $(wc -l < /etc/fail2ban/github-actions-ranges.txt)"'
