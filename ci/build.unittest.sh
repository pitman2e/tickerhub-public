#!/bin/sh
set -e # Exit immediately on error

# Change current working directory to the script's directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Compose reads .env for ${VAR} interpolation; the git-ignored .env.dev
# overrides it when present. The expansion of ENV_FILES is intentionally
# unquoted so each flag is passed separately.
ENV_FILES="--env-file .env"
if [ -f .env.dev ]; then
    ENV_FILES="$ENV_FILES --env-file .env.dev"
fi

export PG_DATABASE=sh_test
export PG_USERNAME=stockhub_test_user
export PG_PASSWORD=stockhub_test_password

# The --exit-code-from flag is critical here.
docker compose $ENV_FILES -f docker-compose.unittest.yml up --build --exit-code-from test
