import assert from "node:assert/strict";
import path from "node:path";
import { validateMealPlanFile } from "./mealPlanValidation";

// Published weeks that must stay valid. A fixture only belongs here while it matches the
// default week shape in lib/settings.ts — a week authored against custom settings will
// fail the meal-count check here even though it is fine in the app.
const fixturePaths: string[] = [
  "data/current-week.md",
  "data/mealplans/mealplan-week-2026-07-27.md",
];

for (const fixturePath of fixturePaths) {
  const result = validateMealPlanFile(path.join(process.cwd(), fixturePath));

  assert.equal(
    result.valid,
    true,
    [
      `${fixturePath} should pass meal-plan validation.`,
      ...result.errors.map((error) => `ERROR: ${error}`),
      ...result.warnings.map((warning) => `WARN: ${warning}`),
    ].join("\n")
  );
}

console.log(`Meal plan fixture tests passed (${fixturePaths.length} fixtures).`);
