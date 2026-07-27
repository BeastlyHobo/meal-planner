import type { DietarySettings } from "@/lib/settings";

/**
 * Goals, and the numeric targets they suggest.
 *
 * A goal never changes numbers on its own. The questionnaire shows the concrete before
 * and after ("Protein floor 30g → 40g") and the user applies it deliberately, because a
 * planner silently retargeting your calories is the kind of thing that makes people stop
 * trusting an app.
 *
 * The goal text is kept on the person regardless of whether the numbers were applied —
 * "we want to stop eating out" is useful context even with no number attached.
 */

export interface GoalPreset {
  id: string;
  label: string;
  description: string;
  /** The numeric targets this goal suggests. */
  patch: Partial<DietarySettings>;
}

export const GOAL_PRESETS: readonly GoalPreset[] = [
  {
    id: "more-protein",
    label: "More protein",
    description: "Raise the per-serving protein floor.",
    patch: { proteinFloorGrams: 40 },
  },
  {
    id: "more-fiber",
    label: "More vegetables and fiber",
    description: "Raise the fiber floor so meals lean on vegetables and legumes.",
    patch: { fiberFloorGrams: 12 },
  },
  {
    id: "lighter-dinners",
    label: "Lighter dinners",
    description: "Pull the calorie window down.",
    patch: { caloriesPerMealMin: 400, caloriesPerMealMax: 600 },
  },
  {
    id: "stop-eating-out",
    label: "Stop eating out",
    description: "Keep dinners short enough that cooking beats ordering.",
    patch: { maxCookMinutes: 30 },
  },
  {
    id: "faster-weeknights",
    label: "Faster weeknights",
    description: "Hard cap on total time, prep plus cook.",
    patch: { maxCookMinutes: 25 },
  },
  {
    id: "more-leftovers",
    label: "More leftovers",
    description: "Cook bigger so dinner covers tomorrow's lunch.",
    patch: { servingsPerDinner: 6 },
  },
];

export function getGoalPreset(id: string): GoalPreset | undefined {
  return GOAL_PRESETS.find((preset) => preset.id === id);
}

/**
 * Apply the selected goals' patches over a dietary block.
 *
 * Later goals win on conflict, which is why GOAL_PRESETS is ordered from broad to
 * specific: picking both "stop eating out" (30 min) and "faster weeknights" (25 min)
 * lands on the tighter 25.
 */
export function applyGoalPresets(
  dietary: DietarySettings,
  goalIds: readonly string[]
): DietarySettings {
  return GOAL_PRESETS.filter((preset) => goalIds.includes(preset.id)).reduce<DietarySettings>(
    (current, preset) => ({ ...current, ...preset.patch }),
    dietary
  );
}

export interface GoalSuggestion {
  label: string;
  field: keyof DietarySettings;
  from: number;
  to: number;
}

/**
 * The concrete numeric changes applying these goals would make, for display.
 * Returns only fields that would actually change, so "no change" reads as an empty list.
 */
export function describeGoalSuggestions(
  dietary: DietarySettings,
  goalIds: readonly string[]
): GoalSuggestion[] {
  const next = applyGoalPresets(dietary, goalIds);

  const numericFields: Array<{ field: keyof DietarySettings; label: string }> = [
    { field: "caloriesPerMealMin", label: "Calories min" },
    { field: "caloriesPerMealMax", label: "Calories max" },
    { field: "proteinFloorGrams", label: "Protein floor (g)" },
    { field: "fiberFloorGrams", label: "Fiber floor (g)" },
    { field: "maxCookMinutes", label: "Max minutes" },
    { field: "servingsPerDinner", label: "Servings per dinner" },
  ];

  return numericFields.flatMap(({ field, label }) => {
    const from = dietary[field];
    const to = next[field];

    if (typeof from !== "number" || typeof to !== "number" || from === to) {
      return [];
    }

    return [{ label, field, from, to }];
  });
}
