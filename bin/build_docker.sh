#!/usr/bin/env bash

REPO_ROOT="$(git rev-parse --show-toplevel)"

build_docker() {
  pushd > /dev/null "${REPO_ROOT}"
  local version
  version=$(cat package.json | jq -r .version)
  image_name="snowball-rss:${version}"
  echo "Building image ${image_name}"
  docker build -t "${image_name}" .
  popd > /dev/null
}

build_docker "$@"
