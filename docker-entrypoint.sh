#!/bin/sh
set -e

# Migrate, then serve. Running this on every start is what makes pulling a new image a
# complete update — Postgres itself only applies db/init on a brand-new data directory.
#
# `set -e` matters here: if the migration fails we must not fall through to serving a
# half-migrated schema. The container exits, and the restart policy retries it.
#
# Set HARVEST_SKIP_MIGRATIONS=1 to start without touching the schema, for the rare case
# where you want to inspect the database first.

# Resolve relative to this script rather than assuming /app, so the same file works in the
# image and from a source checkout.
APP_DIR=$(cd "$(dirname "$0")" && pwd)

if [ "${HARVEST_SKIP_MIGRATIONS}" = "1" ]; then
  echo "[entrypoint] HARVEST_SKIP_MIGRATIONS=1, skipping migrations"
else
  node "${APP_DIR}/scripts/migrate.mjs"
fi

exec "$@"
