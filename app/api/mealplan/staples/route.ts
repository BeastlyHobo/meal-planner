import { NextRequest } from "next/server";
import {
  getLatestMealPlan,
  getMealPlanByWeekRange,
  updateMealPlanLists,
} from "@/lib/services/mealPlanService";
import { ApiError, createRouteHandler } from "@/lib/apiUtils";
import { requireString } from "@/lib/routeValidation";
import { STAPLES_CATALOG } from "@/lib/constants";
import { deriveShoppingListFromMeals } from "@/lib/domain/shoppingListDerivation";
import type { StapleItem, StoredMealPlan } from "@/lib/types";

function findCatalogEntry(category: string) {
  return STAPLES_CATALOG.find((entry) => entry.category === category);
}

async function saveStaples(
  mealPlan: StoredMealPlan,
  staples: StapleItem[],
  updatedFrom: string
) {
  const shoppingList = deriveShoppingListFromMeals(
    mealPlan.meals,
    mealPlan.shoppingList,
    mealPlan.junkList,
    staples
  );

  return updateMealPlanLists(mealPlan.id, {
    shoppingList,
    junkList: mealPlan.junkList,
    staples,
    source: "user_edit",
    generationContext: {
      updatedFrom,
      updatedAt: new Date().toISOString(),
    },
  });
}

async function loadPlan(weekRange: string | null) {
  const mealPlan = weekRange
    ? await getMealPlanByWeekRange(weekRange)
    : await getLatestMealPlan();

  if (!mealPlan) {
    throw new ApiError("Meal plan not found", 404);
  }

  return mealPlan;
}

function readBody(body: unknown) {
  const obj = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    weekRange: typeof obj.weekRange === "string" ? obj.weekRange : null,
    raw: obj,
  };
}

export const POST = createRouteHandler(async (request: NextRequest) => {
  const { weekRange, raw } = readBody(await request.json());
  const category = requireString(raw.category, "category").trim();
  const catalogEntry = findCatalogEntry(category);

  if (!catalogEntry) {
    throw new ApiError("Unknown staple", 400);
  }

  const mealPlan = await loadPlan(weekRange);
  const staples = [...mealPlan.staples];

  if (staples.some((item) => item.category === category)) {
    throw new ApiError("Staple is already on this week's list", 409);
  }

  staples.push({ ...catalogEntry });

  const updated = await saveStaples(mealPlan, staples, "staples_add");
  return { staples: updated.staples };
});

export const DELETE = createRouteHandler(async (request: NextRequest) => {
  const { weekRange, raw } = readBody(await request.json());
  const category = requireString(raw.category, "category").trim();

  const mealPlan = await loadPlan(weekRange);
  const staples = mealPlan.staples.filter((item) => item.category !== category);

  const updated = await saveStaples(mealPlan, staples, "staples_delete");
  return { staples: updated.staples };
});

/** Reset the week's staples back to the full catalog. */
export const PUT = createRouteHandler(async (request: NextRequest) => {
  const { weekRange } = readBody(await request.json());
  const mealPlan = await loadPlan(weekRange);

  const updated = await saveStaples(
    mealPlan,
    STAPLES_CATALOG.map((entry) => ({ ...entry })),
    "staples_reset"
  );

  return { staples: updated.staples };
});
