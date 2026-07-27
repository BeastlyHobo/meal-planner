import { NextRequest } from "next/server";
import { createRouteHandler } from "@/lib/apiUtils";
import {
  getHouseholdSettings,
  saveHouseholdSettings,
} from "@/lib/services/settingsService";
import { describeSettings } from "@/lib/settings";

/**
 * `brief` is the same settings rendered as the plain-text planning brief.
 *
 * The planning docs tell whoever authors a week to read /api/settings every session;
 * shipping the brief alongside the raw object means that is one call, and the person or
 * model reading it does not have to re-derive how two people's answers combine.
 */
export const GET = createRouteHandler(async () => {
  const settings = await getHouseholdSettings();
  return { settings, brief: describeSettings(settings) };
});

export const PUT = createRouteHandler(async (request: NextRequest) => {
  const body = (await request.json()) as unknown;
  // normalizeSettings clamps and drops anything unrecognized, so a bad payload
  // cannot write a shape the app can't read back.
  const settings = await saveHouseholdSettings(body);
  return { settings, brief: describeSettings(settings) };
});
