import fs from "fs";
import { deriveShoppingListFromMeals } from "@/lib/domain/shoppingListDerivation";
import { extractWeekDataFromMarkdown } from "@/lib/mealPlanMarkdown";
import { classifyShoppingItem } from "@/lib/shoppingListOrder";
import { STORES } from "@/lib/stores";
import { ListCategory, Macros, MealInput, MealType, WeekData } from "@/lib/types";
import {
  DEFAULT_SETTINGS,
  HouseholdSettings,
  totalMealsForWeekShape,
} from "@/lib/settings";

import { JUNK_CATEGORY_ORDER, MEAL_TYPES } from "@/lib/constants";

const REQUIRED_JUNK_CATEGORIES: readonly string[] = JUNK_CATEGORY_ORDER;

const MACRO_KEYS = ["cal", "p", "c", "f", "fiber"] as const;

export interface MealPlanValidationOptions {
  printShoppingOrder?: boolean;
  allowShoppingFallbacks?: boolean;
  macroTolerance?: number;
  /**
   * Household settings to validate against. Defaults to DEFAULT_SETTINGS so the
   * validator runs offline, with no database.
   */
  settings?: HouseholdSettings;
}

export interface MealPlanValidationResult {
  valid: boolean;
  filepath: string;
  weekData?: WeekData;
  shoppingList?: ListCategory[];
  errors: string[];
  warnings: string[];
}

export function validateMealPlanFile(
  filepath: string,
  options: MealPlanValidationOptions = {}
): MealPlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const macroTolerance = options.macroTolerance ?? 1;
  const settings = options.settings ?? DEFAULT_SETTINGS;

  try {
    const content = fs.readFileSync(filepath, "utf8");
    const rawWeekData = parseRawWeekData(content);
    const weekData = extractWeekDataFromMarkdown(content);

    validateMealCounts(weekData, settings, errors);
    validateFiberPresence(rawWeekData, errors);
    validateIngredientMacroTotals(weekData, macroTolerance, errors);
    validateUniqueBuildValues(weekData, "base", errors);
    validateUniqueBuildValues(weekData, "engine", errors);
    validateJunkCategories(weekData, errors);
    validateRecipes(weekData, settings, errors, warnings);
    validateDietaryTargets(weekData, settings, warnings);

    const shoppingList = deriveShoppingListFromMeals(
      weekData.meals,
      [],
      weekData.junkList,
      weekData.staples ?? []
    );
    validateShoppingClassifications(
      shoppingList,
      errors,
      warnings,
      Boolean(options.allowShoppingFallbacks)
    );

    if (options.printShoppingOrder) {
      printShoppingOrder(shoppingList);
    }

    return {
      valid: errors.length === 0,
      filepath,
      weekData,
      shoppingList,
      errors,
      warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      valid: false,
      filepath,
      errors: [`Invalid meal plan structure: ${message}`],
      warnings,
    };
  }
}

export function printMealPlanValidationResult(result: MealPlanValidationResult) {
  for (const warning of result.warnings) {
    console.log(`⚠️  ${warning}`);
  }

  for (const error of result.errors) {
    console.log(`❌ ${error}`);
  }

  if (result.valid) {
    console.log("✅ Meal plan validation passed.");
  }
}

function parseRawWeekData(markdown: string): WeekData {
  const match = markdown.match(/```json\s*([\s\S]*?)```/i);

  if (!match) {
    throw new Error("Unable to find a ```json``` block.");
  }

  return JSON.parse(match[1]) as WeekData;
}

function validateMealCounts(
  weekData: WeekData,
  settings: HouseholdSettings,
  errors: string[]
) {
  const counts = weekData.meals.reduce<Partial<Record<MealType, number>>>((acc, meal) => {
    acc[meal.type] = (acc[meal.type] ?? 0) + 1;
    return acc;
  }, {});

  for (const type of MEAL_TYPES) {
    const want = settings.weekShape[type] ?? 0;
    const got = counts[type] ?? 0;
    if (got !== want) {
      errors.push(`Expected ${want} ${type}(s), found ${got}.`);
    }
  }

  const totalExpected = totalMealsForWeekShape(settings.weekShape);
  if (weekData.meals.length !== totalExpected) {
    errors.push(`Expected ${totalExpected} total meals, found ${weekData.meals.length}.`);
  }
}

function validateFiberPresence(weekData: WeekData, errors: string[]) {
  weekData.meals.forEach((meal, mealIndex) => {
    if (!hasNumericMacro(meal.macros, "fiber")) {
      errors.push(`meals[${mealIndex}] "${meal.name}" is missing numeric macros.fiber.`);
    }

    meal.ingredients?.forEach((ingredient, ingredientIndex) => {
      if (!hasNumericMacro(ingredient.macros, "fiber")) {
        errors.push(
          `meals[${mealIndex}].ingredients[${ingredientIndex}] "${ingredient.name}" is missing numeric macros.fiber.`
        );
      }
    });
  });
}

function validateIngredientMacroTotals(weekData: WeekData, tolerance: number, errors: string[]) {
  weekData.meals.forEach((meal, mealIndex) => {
    if (!meal.ingredients?.length) {
      errors.push(`meals[${mealIndex}] "${meal.name}" must include ingredients for macro validation.`);
      return;
    }

    const ingredientTotals = sumIngredientMacros(meal);
    for (const macroKey of MACRO_KEYS) {
      const diff = Math.abs(ingredientTotals[macroKey] - meal.macros[macroKey]);
      if (diff > tolerance) {
        errors.push(
          `meals[${mealIndex}] "${meal.name}" ${macroKey} total mismatch: ingredients=${round(ingredientTotals[macroKey])}, meal=${meal.macros[macroKey]}.`
        );
      }
    }
  });
}

/**
 * Dinners are the meals you cook, so they must carry a recipe. Other meal types may.
 *
 * Timing and yield are checked against settings as warnings, not errors: a 45-minute
 * braise against a 40-minute ceiling is a judgment call, not a broken week.
 */
function validateRecipes(
  weekData: WeekData,
  settings: HouseholdSettings,
  errors: string[],
  warnings: string[]
) {
  weekData.meals.forEach((meal, mealIndex) => {
    const label = `meals[${mealIndex}] "${meal.name}"`;
    const recipe = meal.recipe;

    if (!recipe) {
      if (meal.type === "Dinner") {
        errors.push(`${label} is a Dinner and must include a recipe with steps.`);
      }
      return;
    }

    if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
      errors.push(`${label} has a recipe with no steps.`);
      return;
    }

    if (recipe.steps.some((step) => typeof step !== "string" || !step.trim())) {
      errors.push(`${label} has an empty recipe step.`);
    }

    if (!Number.isFinite(recipe.servings) || recipe.servings < 1) {
      errors.push(`${label} recipe.servings must be at least 1.`);
    }

    const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0);
    if (totalMinutes > settings.dietary.maxCookMinutes) {
      warnings.push(
        `${label} takes ${totalMinutes} min, over the ${settings.dietary.maxCookMinutes} min ceiling.`
      );
    }

    if (meal.type === "Dinner" && recipe.servings < settings.dietary.servingsPerDinner) {
      warnings.push(
        `${label} serves ${recipe.servings}, under the target of ${settings.dietary.servingsPerDinner}.`
      );
    }
  });
}

/** Soft checks. These describe the week; they do not gate publishing. */
function validateDietaryTargets(
  weekData: WeekData,
  settings: HouseholdSettings,
  warnings: string[]
) {
  const { dietary } = settings;

  weekData.meals.forEach((meal, mealIndex) => {
    const label = `meals[${mealIndex}] "${meal.name}"`;

    if (
      meal.macros.cal < dietary.caloriesPerMealMin ||
      meal.macros.cal > dietary.caloriesPerMealMax
    ) {
      warnings.push(
        `${label} is ${meal.macros.cal} cal, outside ${dietary.caloriesPerMealMin}–${dietary.caloriesPerMealMax}.`
      );
    }

    if (meal.macros.p < dietary.proteinFloorGrams) {
      warnings.push(
        `${label} has ${meal.macros.p}g protein, under the ${dietary.proteinFloorGrams}g floor.`
      );
    }

    if (meal.macros.fiber < dietary.fiberFloorGrams) {
      warnings.push(
        `${label} has ${meal.macros.fiber}g fiber, under the ${dietary.fiberFloorGrams}g floor.`
      );
    }
  });

  if (dietary.avoid.length === 0) {
    return;
  }

  const avoidTerms = dietary.avoid.map((term) => term.toLowerCase());
  weekData.meals.forEach((meal, mealIndex) => {
    const haystack = [
      meal.name,
      ...(meal.ingredients?.map((ingredient) => ingredient.name) ?? []),
      ...meal.build.pro,
      ...meal.build.base,
      ...meal.build.veg,
      ...meal.build.engine,
    ]
      .join(" ")
      .toLowerCase();

    for (const term of avoidTerms) {
      if (haystack.includes(term)) {
        warnings.push(`meals[${mealIndex}] "${meal.name}" contains an avoided item: ${term}.`);
      }
    }
  });
}

function validateUniqueBuildValues(
  weekData: WeekData,
  buildKey: "base" | "engine",
  errors: string[]
) {
  const seen = new Map<string, string>();

  weekData.meals.forEach((meal) => {
    for (const value of meal.build[buildKey]) {
      const normalized = normalizeComparableValue(value);
      const previousMeal = seen.get(normalized);

      if (previousMeal) {
        errors.push(`Duplicate ${buildKey} "${value}" in "${previousMeal}" and "${meal.name}".`);
      } else {
        seen.set(normalized, meal.name);
      }
    }
  });
}

function validateJunkCategories(weekData: WeekData, errors: string[]) {
  const actual = weekData.junkList.map((category) => category.category);

  if (actual.length !== REQUIRED_JUNK_CATEGORIES.length) {
    errors.push(
      `Junk list must have ${REQUIRED_JUNK_CATEGORIES.length} categories, found ${actual.length}.`
    );
  }

  REQUIRED_JUNK_CATEGORIES.forEach((category, index) => {
    if (actual[index] !== category) {
      errors.push(
        `Junk list category ${index + 1} must be "${category}", found "${actual[index] ?? "(missing)"}".`
      );
    }
  });
}

function validateShoppingClassifications(
  shoppingList: ListCategory[],
  errors: string[],
  warnings: string[],
  allowShoppingFallbacks: boolean
) {
  const fallbackItems = shoppingList.flatMap((category) =>
    category.items
      .map((item) => ({
        category: category.category,
        itemName: item.n,
        classification: classifyShoppingItem(item.n, item.store ?? category.store),
      }))
      .filter(({ classification }) => classification.confidence === "fallback")
  );

  if (!fallbackItems.length) {
    return;
  }

  const message = `Shopping classification fallback for: ${fallbackItems
    .map((item) => `"${item.itemName}" -> ${item.category}`)
    .join(", ")}.`;

  if (allowShoppingFallbacks) {
    warnings.push(message);
  } else {
    errors.push(message);
  }
}

function printShoppingOrder(shoppingList: ListCategory[]) {
  for (const store of STORES) {
    const sections = shoppingList.filter((category) => category.store === store.key);
    if (sections.length === 0) {
      continue;
    }

    console.log(`🛒 ${store.name} — ${store.cadenceLabel}:`);
    for (const category of sections) {
      console.log(`  ${category.category}: ${category.items.map((item) => item.n).join(", ")}`);
    }
  }
}

function sumIngredientMacros(meal: MealInput): Macros {
  return meal.ingredients!.reduce<Macros>(
    (acc, ingredient) => ({
      cal: acc.cal + ingredient.macros.cal,
      p: acc.p + ingredient.macros.p,
      c: acc.c + ingredient.macros.c,
      f: acc.f + ingredient.macros.f,
      fiber: acc.fiber + ingredient.macros.fiber,
    }),
    { cal: 0, p: 0, c: 0, f: 0, fiber: 0 }
  );
}

function hasNumericMacro(macros: Partial<Macros> | undefined, macroKey: keyof Macros) {
  const value = macros?.[macroKey];
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeComparableValue(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}
