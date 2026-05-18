#!/usr/bin/env bash
# Vercel install: clone private 100days submodule via GITHUB_TOKEN auth,
# shallow + sparse so each build only fetches the latest commit of /content/**.
set -euo pipefail

if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "GITHUB_TOKEN not set — private submodule clone will fail" >&2
  exit 1
fi

git config --global url."https://${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"
git submodule sync --recursive
git -c submodule.recurse=false submodule update --init --depth=1
git -C 100days sparse-checkout set --no-cone '/content/**'
yarn install --immutable
