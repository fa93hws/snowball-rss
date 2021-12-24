#!/usr/bin/env bash

REPO_ROOT="$(git rev-parse --show-toplevel)"

get_image_name() {
  pushd > /dev/null "${REPO_ROOT}"
  local version
  version=$(cat package.json | jq -r .version)
  popd > /dev/null
  echo "fa93hws/snowball-rss:${version}"
}

build_docker() {
  pushd > /dev/null "${REPO_ROOT}"
  local image_name
  image_name=$(get_image_name)
  echo "Building image ${image_name}"
  docker build -t "${image_name}" .
  popd > /dev/null
}

# $1 comand: build or publish
main() {
  local comand="$1"
  case
  in
    build)
      build_docker
      ;;
    publish)
      docker push $(get_image_name)
      ;;
    *)
      echo "Usage: $0 build|publish"
      exit 1
      ;;
  esac
}

main "$@"
