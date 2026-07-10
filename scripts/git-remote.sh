#!/usr/bin/env bash
#
# git-remote.sh — flip the active push/track remote between GitHub and GitLab.
#
# Why this exists:
#   The GitHub account that owns `origin` is temporarily suspended, so the repo
#   is backed up to and pushed to a GitLab mirror in the meantime. This script
#   switches the *active* remote WITHOUT ever mutating `origin`, so returning to
#   GitHub once the account is restored is a single command.
#
# Usage:
#   ./scripts/git-remote.sh gitlab   # push + track GitLab  (use while GitHub is down)
#   ./scripts/git-remote.sh github   # push + track GitHub  (use once un-suspended)
#   ./scripts/git-remote.sh status   # show the current active remote
#
# Design notes:
#   * `origin` is ALWAYS GitHub and is never changed by this script — that is
#     what makes the switch-back trivial and non-destructive.
#   * A second remote named `gitlab` holds the backup.
#   * The flip is driven by `remote.pushDefault`, so a bare `git push` (including
#     the content-publish automation, which calls `git push` with no remote arg)
#     targets whichever remote is active.
#   * Branch upstreams are repointed too, so `git status` ahead/behind and
#     `git pull` reflect the active remote.
#
set -euo pipefail

GITHUB_REMOTE="origin"
GITLAB_REMOTE="gitlab"

die() { echo "error: $*" >&2; exit 1; }

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || die "not inside a git repository"
cd "$repo_root"

have_remote() { git remote get-url "$1" >/dev/null 2>&1; }

# Point each local branch's upstream at <remote>/<branch> when that ref exists.
retrack() {
  local remote="$1" b
  for b in $(git for-each-ref --format='%(refname:short)' refs/heads); do
    if git rev-parse --verify --quiet "$remote/$b" >/dev/null 2>&1; then
      git branch --set-upstream-to="$remote/$b" "$b" >/dev/null 2>&1 || true
    fi
  done
}

show_status() {
  local pd upstream
  pd="$(git config --get remote.pushDefault || true)"
  upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo 'none')"
  echo "active push remote : ${pd:-origin (git default)}"
  echo "current branch     : $(git rev-parse --abbrev-ref HEAD)  ->  upstream: ${upstream}"
  echo "remotes:"
  git remote -v | awk '{print "  " $0}'
}

case "${1:-status}" in
  gitlab)
    have_remote "$GITLAB_REMOTE" || die "no '$GITLAB_REMOTE' remote configured — add it first"
    git fetch "$GITLAB_REMOTE" --quiet || true
    git config remote.pushDefault "$GITLAB_REMOTE"
    retrack "$GITLAB_REMOTE"
    echo "-> Active remote is now GitLab. A bare 'git push' backs up to GitLab."
    echo "   Flip back to GitHub later with: ./scripts/git-remote.sh github"
    echo
    ;;
  github)
    have_remote "$GITHUB_REMOTE" || die "no '$GITHUB_REMOTE' remote configured"
    git config --unset remote.pushDefault 2>/dev/null || true   # bare push -> upstream (origin)
    retrack "$GITHUB_REMOTE"
    echo "-> Active remote is now GitHub ($GITHUB_REMOTE). Normal workflow restored."
    echo "   (Pushes will fail until the GitHub account is un-suspended.)"
    echo
    ;;
  status) ;;
  *) echo "usage: $0 {gitlab|github|status}"; exit 1 ;;
esac

show_status
