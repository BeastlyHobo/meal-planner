import type { MealType } from "@/lib/types";
import { MEAL_TYPES } from "@/lib/constants";
import {
  collectGoals,
  normalizePeople,
  personDisplayName,
  personHasAnswers,
  reconcilePeople,
  unionFoodLists,
  type PersonProfile,
  type ReconciledPreferences,
} from "@/lib/settings/people";

export * from "@/lib/settings/people";
export * from "@/lib/settings/goals";

/**
 * Household settings.
 *
 * Everything here used to be hardcoded — the 1 breakfast / 1 lunch / 2 dinners week and
 * one household's dietary rules. It now lives in the database, editable at /settings for
 * the numbers and at /onboarding for taste, so the week shape and the diet the planner
 * writes against are yours.
 */

export type WeekShapeSettings = Record<MealType, number>;

export interface DietarySettings {
  /** Per-serving calorie window. Applied loosely — satiety beats hitting a number. */
  caloriesPerMealMin: number;
  caloriesPerMealMax: number;
  /** Grams of protein a meal should clear. */
  proteinFloorGrams: number;
  /** Grams of fiber a meal should clear. */
  fiberFloorGrams: number;
  /** Weeknight time ceiling, prep plus cook. */
  maxCookMinutes: number;
  /** Servings a dinner recipe should yield (2 adults + leftovers = 4). */
  servingsPerDinner: number;
  /** Proteins to rotate through. Empty means no constraint. */
  proteins: string[];
  /** Cuisines to rotate through. Empty means no constraint. */
  cuisines: string[];
  /**
   * Hard nos — allergies, refusals, anything that must never appear.
   *
   * Additive: everyone's questionnaire hard nos are folded in on every normalize and are
   * never removed here. Dropping an allergy means editing that person, not this list.
   */
  avoid: string[];
  /**
   * Household goals chosen in the questionnaire, by label.
   *
   * Recorded whether or not their suggested numbers were applied — "we want to stop
   * eating out" is useful context to a planner even with no target attached to it.
   */
  goals: string[];
  /** Free text for anything the fields above do not capture. */
  notes: string;
}

export interface HouseholdSettings {
  weekShape: WeekShapeSettings;
  dietary: DietarySettings;
  /** Per-person taste profiles from the questionnaire. Empty until it is filled in. */
  people: PersonProfile[];
  /** ISO timestamp, or null when the questionnaire has never been finished or skipped. */
  completedOnboardingAt: string | null;
}

export const SETTINGS_KEY = "household";

/**
 * Defaults for a two-adult household that shops a weekly store twice and a warehouse
 * once a month: breakfast and lunch come off the staples list, so the planned week is
 * four dinners. Change any of it at /settings.
 */
export const DEFAULT_SETTINGS: HouseholdSettings = {
  weekShape: {
    Breakfast: 0,
    Lunch: 0,
    Dinner: 4,
    Snack: 0,
  },
  dietary: {
    caloriesPerMealMin: 450,
    caloriesPerMealMax: 700,
    proteinFloorGrams: 30,
    fiberFloorGrams: 8,
    maxCookMinutes: 40,
    servingsPerDinner: 4,
    proteins: [
      "Chicken thighs",
      "Chicken breast",
      "Ground beef",
      "Ground turkey",
      "Shrimp",
      "Salmon",
      "White fish",
      "Eggs",
      "Beans and lentils",
      "Tofu",
    ],
    cuisines: [
      "Mediterranean",
      "Mexican / Tex-Mex",
      "Thai / Southeast Asian",
      "Indian",
      "Chinese",
      "American comfort",
    ],
    avoid: [],
    goals: [],
    notes: "",
  },
  people: [],
  completedOnboardingAt: null,
};

export const MIN_MEALS_PER_TYPE = 0;
export const MAX_MEALS_PER_TYPE = 14;

/** Total planned meals implied by a week shape. */
export function totalMealsForWeekShape(weekShape: WeekShapeSettings): number {
  return MEAL_TYPES.reduce((sum, type) => sum + (weekShape[type] ?? 0), 0);
}

/** Meal types the week actually plans, in canonical order. */
export function plannedMealTypes(weekShape: WeekShapeSettings): MealType[] {
  return MEAL_TYPES.filter((type) => (weekShape[type] ?? 0) > 0);
}

function clampInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const cleaned = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/**
 * Coerce arbitrary stored or submitted JSON into valid settings.
 *
 * Always returns something usable: unknown fields are dropped and out-of-range numbers
 * are clamped, so a hand-edited row or a settings blob written before the questionnaire
 * existed can never break the app.
 *
 * This is also where per-person answers become household rules: the reconciled hard nos
 * and cuisines are folded into `dietary`, so every existing consumer — the validator, the
 * planning brief — keeps reading one flat list and needs no knowledge of people.
 */
export function normalizeSettings(value: unknown): HouseholdSettings {
  const raw = isRecord(value) ? value : {};
  const rawWeekShape = isRecord(raw.weekShape) ? raw.weekShape : {};
  const rawDietary = isRecord(raw.dietary) ? raw.dietary : {};
  const defaults = DEFAULT_SETTINGS;
  const people = normalizePeople(raw.people);
  const reconciled = reconcilePeople(people);

  const weekShape = MEAL_TYPES.reduce<WeekShapeSettings>((acc, type) => {
    acc[type] = clampInt(
      rawWeekShape[type],
      defaults.weekShape[type],
      MIN_MEALS_PER_TYPE,
      MAX_MEALS_PER_TYPE
    );
    return acc;
  }, {} as WeekShapeSettings);

  const caloriesPerMealMin = clampInt(
    rawDietary.caloriesPerMealMin,
    defaults.dietary.caloriesPerMealMin,
    0,
    5000
  );
  const caloriesPerMealMax = clampInt(
    rawDietary.caloriesPerMealMax,
    defaults.dietary.caloriesPerMealMax,
    caloriesPerMealMin,
    5000
  );

  return {
    weekShape,
    dietary: {
      caloriesPerMealMin,
      caloriesPerMealMax,
      proteinFloorGrams: clampInt(rawDietary.proteinFloorGrams, defaults.dietary.proteinFloorGrams, 0, 300),
      fiberFloorGrams: clampInt(rawDietary.fiberFloorGrams, defaults.dietary.fiberFloorGrams, 0, 200),
      maxCookMinutes: clampInt(rawDietary.maxCookMinutes, defaults.dietary.maxCookMinutes, 5, 480),
      servingsPerDinner: clampInt(rawDietary.servingsPerDinner, defaults.dietary.servingsPerDinner, 1, 20),
      proteins: normalizeStringList(rawDietary.proteins, defaults.dietary.proteins),
      cuisines: unionFoodLists(
        normalizeStringList(rawDietary.cuisines, defaults.dietary.cuisines),
        reconciled.cuisines
      ),
      // Additive on purpose: a numbers screen must not be able to drop an allergy.
      avoid: unionFoodLists(
        normalizeStringList(rawDietary.avoid, defaults.dietary.avoid),
        reconciled.neverUse
      ),
      goals: normalizeStringList(rawDietary.goals, defaults.dietary.goals),
      notes: typeof rawDietary.notes === "string" ? rawDietary.notes.trim() : defaults.dietary.notes,
    },
    people,
    completedOnboardingAt:
      typeof raw.completedOnboardingAt === "string" && raw.completedOnboardingAt.trim()
        ? raw.completedOnboardingAt.trim()
        : null,
  };
}

/** The reconciliation for a settings object, for UI and briefs. */
export function getReconciledPreferences(
  settings: HouseholdSettings
): ReconciledPreferences {
  return reconcilePeople(settings.people);
}

/** A compact, human-readable brief handed to whoever (or whatever) plans the week. */
export function describeSettings(settings: HouseholdSettings): string {
  const { weekShape, dietary } = settings;
  const shape = plannedMealTypes(weekShape)
    .map((type) => `${weekShape[type]} ${type.toLowerCase()}${weekShape[type] === 1 ? "" : "s"}`)
    .join(", ");

  const lines = [
    `Week shape: ${shape || "no meals planned"}.`,
    `Calories per serving: ${dietary.caloriesPerMealMin}–${dietary.caloriesPerMealMax}.`,
    `Protein floor: ${dietary.proteinFloorGrams}g. Fiber floor: ${dietary.fiberFloorGrams}g.`,
    `Time ceiling: ${dietary.maxCookMinutes} minutes, prep plus cook.`,
    `Dinner recipes serve ${dietary.servingsPerDinner}.`,
  ];

  if (dietary.proteins.length) {
    lines.push(`Rotate proteins: ${dietary.proteins.join(", ")}.`);
  }
  if (dietary.cuisines.length) {
    lines.push(`Rotate cuisines: ${dietary.cuisines.join(", ")}.`);
  }
  if (dietary.avoid.length) {
    lines.push(`Never use: ${dietary.avoid.join(", ")}.`);
  }
  if (dietary.goals.length) {
    lines.push(`Household goals: ${dietary.goals.join(", ")}.`);
  }
  if (dietary.notes) {
    lines.push(`Notes: ${dietary.notes}`);
  }

  const peopleSection = describePeople(settings);
  if (peopleSection) {
    lines.push("", peopleSection);
  }

  return lines.join("\n");
}

/**
 * The per-person half of the brief.
 *
 * Reconciled buckets come first because they are the actionable instruction; the
 * individual profiles follow so the planner can tell whose preference it is serving when
 * it has to pick a side on a contested item.
 */
export function describePeople(settings: HouseholdSettings): string {
  const answering = settings.people.filter(personHasAnswers);
  if (answering.length === 0) {
    return "";
  }

  const reconciled = reconcilePeople(settings.people);
  const lines: string[] = ["Who is eating:"];

  settings.people.forEach((person, index) => {
    const name = personDisplayName(person, index);
    if (!personHasAnswers(person)) {
      lines.push(`- ${name}: no answers yet.`);
      return;
    }

    const parts: string[] = [];
    if (person.loves.length) parts.push(`loves ${person.loves.join(", ")}`);
    if (person.dislikes.length) parts.push(`dislikes ${person.dislikes.join(", ")}`);
    if (person.allergies.length) parts.push(`ALLERGIC TO ${person.allergies.join(", ")}`);
    if (person.neverEat.length) parts.push(`will not eat ${person.neverEat.join(", ")}`);
    if (person.cuisines.length) parts.push(`wants more ${person.cuisines.join(", ")}`);
    if (person.goals.length) parts.push(`goals: ${person.goals.join(", ")}`);

    lines.push(`- ${name}: ${parts.join("; ") || "no answers yet"}.`);
    if (person.notes) {
      lines.push(`  Notes: ${person.notes}`);
    }
  });

  lines.push("", "Reconciled across the household:");
  if (reconciled.neverUse.length) {
    lines.push(`- Never use (someone cannot eat these): ${reconciled.neverUse.join(", ")}.`);
  }
  if (reconciled.everyoneLoves.length) {
    lines.push(`- Everyone loves — feature often: ${reconciled.everyoneLoves.join(", ")}.`);
  }
  if (reconciled.someoneLoves.length) {
    lines.push(`- One of them loves — rotate in: ${reconciled.someoneLoves.join(", ")}.`);
  }
  if (reconciled.contested.length) {
    lines.push(
      `- Split (one loves, one dislikes) — occasional, or make it easy to leave out: ${reconciled.contested.join(", ")}.`
    );
  }

  const goals = collectGoals(settings.people);
  if (goals.length) {
    lines.push(`- Goals: ${goals.join(", ")}.`);
  }

  return lines.join("\n");
}
