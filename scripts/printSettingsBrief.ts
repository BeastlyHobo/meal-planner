#!/usr/bin/env tsx

/**
 * Print the household planning brief.
 *
 * The same text the /api/settings response carries, for when you are authoring a week
 * from a terminal or handing context to an assistant without a running server.
 *
 * Needs DATABASE_URL. Falls back to the defaults brief if the database is unreachable,
 * so it always prints something usable.
 */

import { describeSettings } from "@/lib/settings";
import { getHouseholdSettings } from "@/lib/services/settingsService";

async function main() {
  const settings = await getHouseholdSettings();
  console.log(describeSettings(settings));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
