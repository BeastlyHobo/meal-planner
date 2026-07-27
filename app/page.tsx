import { redirect } from "next/navigation";
import { getHouseholdSettings } from "@/lib/services/settingsService";

/**
 * Root route: first run goes to the questionnaire, everyone else goes to the menu.
 *
 * `getHouseholdSettings` falls back to defaults when the database is unreachable, so a
 * broken DB also lands here — the questionnaire's "Skip for now" writes the timestamp and
 * gets you past it either way.
 */
// Reads the database, so it must not be prerendered at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getHouseholdSettings();
  redirect(settings.completedOnboardingAt ? "/menu" : "/onboarding");
}
