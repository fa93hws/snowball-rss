#!/usr/bin/env bash
set -eu
set -o pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

source "${REPO_ROOT}/bin/_version.sh"

get_image_name() {
  local version
  version=$(_get_version)
  echo "fa93hws/snowball-rss:${version}"
}

build_docker() {
  local image_name
  image_name=$(get_image_name)
  echo "Building image ${image_name}"
  docker build -t "${image_name}" .
}

# $1 comand: build or publish
main() {
  if [[ "$#" == 0 ]]; then
    echo "Usage: $0 <command>"
    echo "  command: build or publish"
    exit 1
  fi
  local command="$1"
  pushd "${REPO_ROOT}" >/dev/null
  case "${command}" in
    build)
      build_docker
      ;;
    publish)
      docker push $(get_image_name)
      ;;
    *)
      echo "unknown command: ${command}, must be build or publish"
      exit 1
      ;;
  esac
  popd > /dev/null
}

main "$@"
