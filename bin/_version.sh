#!/usr/bin/env bash

[[ -n "${WEBDEV_PATH:-}" ]] && return
declare -r WEBDEV_PATH=1

REPO_ROOT=$(git rev-parse --show-toplevel)

_get_version() {
  pushd > /dev/null "${REPO_ROOT}"
  local version
  cat package.json | jq -r .version
  popd > /dev/null
}