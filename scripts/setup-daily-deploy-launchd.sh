#!/usr/bin/env bash
set -euo pipefail

# setup-daily-deploy-launchd.sh — schedule a daily production deploy of
# dawsonwang.com so the homepage stats graph stays in sync with the latest
# publish-manifest.json data collected in ~/Documents/100Days.
#
# It wraps scripts/deploy-local.ts (isolated worktree → rsync fresh content →
# offline build → prebuilt Vercel deploy). The LaunchAgent runs it via
# `zsh -lc`, which sources your login profile so Homebrew's node/yarn/npx are on
# PATH — the exact bug that silently killed the metrics collector (a bare launchd
# PATH of /usr/local/bin:/usr/bin:/bin can't find /opt/homebrew/bin/node).
#
# Usage: scripts/setup-daily-deploy-launchd.sh <install|uninstall|status|run-now>

PLIST_LABEL="com.dawson.dawsonwang.daily-deploy"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_LABEL.plist"
LOG_DIR="$PROJECT_DIR/logs"
# Hour (local time) to deploy each day. Any time works — the collector refreshes
# manifests every 15 min — so this is just "publish the freshest graph once/day".
DEPLOY_HOUR="${DEPLOY_HOUR:-8}"

usage() {
  cat <<'USAGE'
Usage: scripts/setup-daily-deploy-launchd.sh <install|uninstall|status|run-now>

Commands:
  install    Register + start LaunchAgent (deploys once daily at $DEPLOY_HOUR:00, default 08:00)
  uninstall  Unload + remove the LaunchAgent and its plist
  status     Show LaunchAgent load status
  run-now    Run one deploy immediately in the foreground (deploy-local.ts)

Env overrides:
  DEPLOY_HOUR   Local hour (0-23) for the daily deploy (default 8)
USAGE
  exit 1
}

[ "$#" -eq 1 ] || usage

require_launchctl() {
  command -v launchctl >/dev/null 2>&1 || { echo "ERROR: launchctl not available"; exit 1; }
}

install_agent() {
  mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

  # --no-poll: unattended runs don't wait on a specific /day/N URL. deploy-local.ts
  # reads VERCEL_TOKEN from the repo .env, so no secret is embedded in the plist.
  cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>$PLIST_LABEL</string>
    <key>ProgramArguments</key>
    <array>
      <string>/bin/zsh</string>
      <string>-lc</string>
      <string>cd "$PROJECT_DIR" &amp;&amp; yarn tsx scripts/deploy-local.ts --no-poll</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
      <key>Hour</key><integer>$DEPLOY_HOUR</integer>
      <key>Minute</key><integer>0</integer>
    </dict>
    <key>EnvironmentVariables</key>
    <dict>
      <key>CI</key><string>1</string>
    </dict>
    <key>StandardOutPath</key>
    <string>$LOG_DIR/daily-deploy.out.log</string>
    <key>StandardErrorPath</key>
    <string>$LOG_DIR/daily-deploy.err.log</string>
  </dict>
</plist>
EOF

  if launchctl print "gui/$(id -u)/$PLIST_LABEL" >/dev/null 2>&1; then
    launchctl bootout "gui/$(id -u)/$PLIST_LABEL" >/dev/null 2>&1 || true
  fi
  launchctl bootstrap "gui/$(id -u)" "$PLIST_PATH"
  echo "Installed LaunchAgent: $PLIST_LABEL (daily at $(printf '%02d' "$DEPLOY_HOUR"):00)"
  echo "Plist: $PLIST_PATH"
  echo "Logs:  $LOG_DIR/daily-deploy.*.log"
}

uninstall_agent() {
  if launchctl print "gui/$(id -u)/$PLIST_LABEL" >/dev/null 2>&1; then
    launchctl bootout "gui/$(id -u)/$PLIST_LABEL" || true
  fi
  rm -f "$PLIST_PATH"
  echo "Uninstalled LaunchAgent: $PLIST_LABEL"
}

status_agent() {
  if launchctl print "gui/$(id -u)/$PLIST_LABEL" >/dev/null 2>&1; then
    launchctl print "gui/$(id -u)/$PLIST_LABEL"
    return 0
  fi
  if [ -f "$PLIST_PATH" ]; then
    echo "LaunchAgent plist exists but not loaded: $PLIST_PATH"; return 1
  fi
  echo "LaunchAgent not installed"; return 1
}

run_now() {
  (cd "$PROJECT_DIR" && yarn tsx scripts/deploy-local.ts --no-poll)
}

case "$1" in
  install)   require_launchctl; install_agent ;;
  uninstall) require_launchctl; uninstall_agent ;;
  status)    require_launchctl; status_agent ;;
  run-now)   run_now ;;
  *)         usage ;;
esac
