#!/usr/bin/env bash
# this is aim to run in docker

set -eu
set -o pipefail

# We checked in font file `WeiRuanYaHei.ttf` to github as LFS
# However, github has rate limit on LFS bandwidth, keep downloading it on CI is very expensive.
# As a consequence, it is uploaded to aws s3 and downloaded manually on CI.
# $1: local path to store downloaded font.
download_font() {
  local file_target="$1"
  if [[ -n "${AWS_ACCESS_KEY_ID:-}" ]] && [[ -n "${AWS_SECRET_ACCESS_KEY:-}" ]] && [[ -n "${AWS_DEFAULT_REGION:-}" ]] && [[ -n "${FONT_FILE_S3_PATH:-}" ]]; then 
    aws s3 cp "${FONT_FILE_S3_PATH}" "${file_target}"
    echo "Download font from s3"
  else
    echo "AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, FONT_FILE_S3_PATH are required"
    exit 1
  fi
}

download_font "$@"
