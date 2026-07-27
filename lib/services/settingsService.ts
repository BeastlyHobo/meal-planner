import type { PoolClient } from "pg";
import { pool } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  HouseholdSettings,
  normalizeSettings,
  SETTINGS_KEY,
} from "@/lib/settings";

interface AppSettingsRow {
  key: string;
  value: unknown;
}

/**
 * Read household settings, falling back to defaults.
 *
 * Settings are advisory — they shape the planning brief and the validator, they never
 * block the app — so a missing row or a missing table degrades to defaults rather than
 * erroring. That keeps the app usable before migrations have been run.
 */
export async function getHouseholdSettings(): Promise<HouseholdSettings> {
  // pool.connect() is inside the try on purpose: an unreachable database throws here,
  // not at query time, and this function promises callers it always returns settings.
  let client: PoolClient | undefined;

  try {
    client = await pool.connect();
    const result = await client.query<AppSettingsRow>(
      `SELECT key, value FROM app_settings WHERE key = $1 LIMIT 1`,
      [SETTINGS_KEY]
    );

    const row = result.rows[0];
    return row ? normalizeSettings(row.value) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  } finally {
    client?.release();
  }
}

export async function saveHouseholdSettings(
  input: unknown
): Promise<HouseholdSettings> {
  const settings = normalizeSettings(input);
  const client = await pool.connect();

  try {
    await client.query(
      `
        INSERT INTO app_settings (key, value)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      `,
      [SETTINGS_KEY, JSON.stringify(settings)]
    );

    return settings;
  } finally {
    client.release();
  }
}
