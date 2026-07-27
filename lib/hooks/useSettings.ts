"use client";

import useSWR from "swr";
import { DEFAULT_SETTINGS, HouseholdSettings, normalizeSettings } from "@/lib/settings";

async function fetchSettings(url: string): Promise<HouseholdSettings> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load settings.");
  }

  const payload = await response.json();
  return normalizeSettings(payload?.data?.settings);
}

/**
 * Household settings for client components.
 *
 * Always resolves to something usable: while loading, or if the request fails, callers
 * get DEFAULT_SETTINGS rather than null, so no screen has to render a settings-shaped
 * empty state.
 */
export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<HouseholdSettings>(
    "/api/settings",
    fetchSettings
  );

  return {
    settings: data ?? DEFAULT_SETTINGS,
    isLoading,
    error: error instanceof Error ? error.message : null,
    refresh: mutate,
  };
}

export async function saveSettings(settings: HouseholdSettings): Promise<HouseholdSettings> {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(
      payload && typeof payload.error === "string" ? payload.error : "Unable to save settings."
    );
  }

  const payload = await response.json();
  return normalizeSettings(payload?.data?.settings);
}
