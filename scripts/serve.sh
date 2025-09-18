#!/usr/bin/env bash
set -euo pipefail

# Ensure bundler installs to vendor/bundle locally (no system gems)
export BUNDLE_PATH="vendor/bundle"

bundle install

# Build and serve with live reload, detached (background)
bundle exec jekyll serve --livereload --detach

echo "Jekyll is serving at http://127.0.0.1:4000 (detached)."

