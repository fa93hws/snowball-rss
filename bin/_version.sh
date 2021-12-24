#!/usr/bin/env bash

[[ -n "${WEBDEV_PATH:-}" ]] && return
declare -r WEBDEV_PATH=1

REPO_ROOT=$(git rev-parse --show-toplevel)

_get_version() {
  pushd "${REPO_ROOT}" >/dev/null
  local version
  cat package.json | jq -r .version
  popd > /dev/null
}
