#!/usr/bin/env node

/**
 * Apply pending database migrations.
 *
 * Postgres only runs `/docker-entrypoint-initdb.d` when its data directory is empty, so
 * a stack that has been running for a while never sees new SQL. This runs on every
 * container start instead, which is what makes `docker compose pull && up -d` a complete
 * update rather than a trap.
 *
 * Deliberately plain ESM JavaScript: the production image contains neither TypeScript nor
 * tsx. `pg` resolves from the Next standalone tree, which already traces it.
 *
 * Safe to point at a database that predates this script. There will be no
 * schema_migrations table, so every file replays — and every file in db/init is written to
 * be idempotent (CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS, guarded UPDATE), so a
 * replay is a no-op on a current database and a repair on a stale one.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const MIGRATIONS_DIR = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  "db",
  "init"
);

/** Any two containers starting together must not race each other through the files. */
const ADVISORY_LOCK_KEY = 8749321;

const CONNECT_ATTEMPTS = 30;
const CONNECT_RETRY_MS = 2000;

function log(message) {
  console.log(`[migrate] ${message}`);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Postgres accepts TCP connections a moment before it is ready to serve, and a compose
 * healthcheck only narrows that window rather than closing it. Retry rather than crash-loop
 * the container.
 */
async function connectWithRetry(connectionString) {
  for (let attempt = 1; attempt <= CONNECT_ATTEMPTS; attempt += 1) {
    const client = new Client({ connectionString });

    try {
      await client.connect();
      return client;
    } catch (error) {
      await client.end().catch(() => {});

      if (attempt === CONNECT_ATTEMPTS) {
        throw error;
      }

      log(
        `database not ready (attempt ${attempt}/${CONNECT_ATTEMPTS}): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      await sleep(CONNECT_RETRY_MS);
    }
  }

  throw new Error("unreachable");
}

async function listMigrationFiles() {
  const entries = await readdir(MIGRATIONS_DIR);
  return entries.filter((name) => name.endsWith(".sql")).sort();
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const files = await listMigrationFiles();
  if (files.length === 0) {
    log(`no .sql files in ${MIGRATIONS_DIR}, nothing to do`);
    return;
  }

  const client = await connectWithRetry(connectionString);

  try {
    await client.query(`SELECT pg_advisory_lock($1)`, [ADVISORY_LOCK_KEY]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows } = await client.query(`SELECT filename FROM schema_migrations`);
    const applied = new Set(rows.map((row) => row.filename));
    const pending = files.filter((file) => !applied.has(file));

    if (pending.length === 0) {
      log(`up to date (${files.length} migration${files.length === 1 ? "" : "s"} applied)`);
      return;
    }

    log(`applying ${pending.length} migration${pending.length === 1 ? "" : "s"}`);

    for (const file of pending) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");

      // One transaction per file: a failure leaves that migration unrecorded and the
      // database unchanged, so a fixed image can retry from the same point.
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [file]);
        await client.query("COMMIT");
        log(`applied ${file}`);
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw new Error(
          `${file} failed: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    log("done");
  } finally {
    // Releasing is best-effort; closing the connection drops the lock regardless.
    await client.query(`SELECT pg_advisory_unlock($1)`, [ADVISORY_LOCK_KEY]).catch(() => {});
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error(`[migrate] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
