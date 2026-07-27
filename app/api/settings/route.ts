import { NextRequest } from "next/server";
import { createRouteHandler } from "@/lib/apiUtils";
import {
  getHouseholdSettings,
  saveHouseholdSettings,
} from "@/lib/services/settingsService";

export const GET = createRouteHandler(async () => {
  const settings = await getHouseholdSettings();
  return { settings };
});

export const PUT = createRouteHandler(async (request: NextRequest) => {
  const body = (await request.json()) as unknown;
  // normalizeSettings clamps and drops anything unrecognized, so a bad payload
  // cannot write a shape the app can't read back.
  const settings = await saveHouseholdSettings(body);
  return { settings };
});
