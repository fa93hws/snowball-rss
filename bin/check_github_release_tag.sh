#!/usr/bin/env bash
set -eu
set -o pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

source "${REPO_ROOT}/bin/_version.sh"

# $1: github tag
check_github_release_tag() {
  if [[ "$#" == 0 ]]; then
    echo "github tag must not be empty"
    exit 1
  fi
  local github_tag="$1"
  local version=$(_get_version)
  if [[ "${version}" != "${github_tag}" ]]; then
    echo "package version ${version} does not match github tag ${github_tag}"
    exit 1
  fi
}

check_github_release_tag "$@"