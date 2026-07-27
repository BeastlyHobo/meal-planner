import assert from "node:assert/strict";
import {
  ALLERGY_SUGGESTIONS,
  applyGoalPresets,
  createPersonProfile,
  CUISINE_SUGGESTIONS,
  DEFAULT_SETTINGS,
  describeGoalSuggestions,
  describeSettings,
  FOOD_SUGGESTIONS,
  GOAL_PRESETS,
  listIncludes,
  normalizeSettings,
  PERSON_GOAL_SUGGESTIONS,
  PROTEIN_SUGGESTIONS,
  reconcilePeople,
  toggleInList,
  type HouseholdSettings,
  type PersonProfile,
} from "@/lib/settings";

function person(overrides: Partial<PersonProfile> & { id: string }): PersonProfile {
  return { ...createPersonProfile(overrides.name ?? "", 0), ...overrides };
}

// --- Reconciliation: hard nos are a union, never an intersection ------------

const tristan = person({
  id: "person-1",
  name: "Tristan",
  loves: ["Mushrooms", "Shrimp", "Spicy food"],
  dislikes: ["Olives"],
  neverEat: ["Liver"],
  cuisines: ["Thai"],
});

const marisa = person({
  id: "person-2",
  name: "Marisa",
  loves: ["Spicy food", "Olives"],
  dislikes: ["Mushrooms"],
  allergies: ["Shrimp"],
  cuisines: ["Mediterranean"],
});

const reconciled = reconcilePeople([tristan, marisa]);

// One person's allergy takes the food off the table for both, even though the other
// listed it as something they love.
assert.ok(
  reconciled.neverUse.includes("Shrimp"),
  "an allergy from either person becomes a household hard no"
);
assert.ok(reconciled.neverUse.includes("Liver"), "a refusal is a hard no too");
assert.ok(
  !reconciled.everyoneLoves.includes("Shrimp") &&
    !reconciled.someoneLoves.includes("Shrimp") &&
    !reconciled.contested.includes("Shrimp"),
  "a hard no is stripped out of every loves bucket"
);

assert.deepEqual(reconciled.everyoneLoves, ["Spicy food"]);
// Mushrooms: loved by one, disliked by the other. Olives: same, other direction.
assert.deepEqual(reconciled.contested.sort(), ["Mushrooms", "Olives"]);
assert.deepEqual(reconciled.someoneLoves, []);
assert.deepEqual(reconciled.cuisines.sort(), ["Mediterranean", "Thai"]);

// --- someoneLoves vs everyoneLoves -----------------------------------------

const soloLove = reconcilePeople([
  person({ id: "a", name: "A", loves: ["Farro", "Eggs"] }),
  person({ id: "b", name: "B", loves: ["Eggs"] }),
]);
assert.deepEqual(soloLove.everyoneLoves, ["Eggs"], "loved by all who answered");
assert.deepEqual(soloLove.someoneLoves, ["Farro"], "loved by one, disliked by none");

// A person with nothing filled in must not make everything "loved by only one".
const withBlankPerson = reconcilePeople([
  person({ id: "a", name: "A", loves: ["Eggs"] }),
  person({ id: "b", name: "B" }),
]);
assert.deepEqual(
  withBlankPerson.everyoneLoves,
  ["Eggs"],
  "people who answered nothing are ignored, not counted as dissenting"
);

// Case and whitespace differences are the same food.
const caseInsensitive = reconcilePeople([
  person({ id: "a", name: "A", loves: [" Mushrooms "] }),
  person({ id: "b", name: "B", loves: ["mushrooms"] }),
]);
assert.equal(caseInsensitive.everyoneLoves.length, 1);
assert.deepEqual(caseInsensitive.someoneLoves, []);

// No answers at all yields no rules rather than throwing.
const empty = reconcilePeople([]);
assert.deepEqual(empty.neverUse, []);
assert.deepEqual(empty.everyoneLoves, []);

// --- normalizeSettings folds people into dietary ---------------------------

const normalized = normalizeSettings({
  people: [tristan, marisa],
  dietary: { ...DEFAULT_SETTINGS.dietary, avoid: ["Pineapple"] },
});

assert.ok(normalized.dietary.avoid.includes("Pineapple"), "manual entries survive");
assert.ok(normalized.dietary.avoid.includes("Shrimp"), "allergies are folded in");
assert.ok(normalized.dietary.avoid.includes("Liver"), "refusals are folded in");
assert.ok(
  normalized.dietary.cuisines.includes("Thai") &&
    normalized.dietary.cuisines.includes("Mediterranean"),
  "questionnaire cuisines are folded in"
);

// The fold is additive: submitting settings that omit a people-derived entry from `avoid`
// must not delete it, or a numbers screen could quietly drop somebody's allergy.
const afterEditingAvoid = normalizeSettings({
  ...normalized,
  dietary: { ...normalized.dietary, avoid: ["Pineapple"] },
});
assert.ok(
  afterEditingAvoid.dietary.avoid.includes("Shrimp"),
  "an allergy cannot be removed by editing the avoid list"
);

// --- Backwards compatibility with the pre-questionnaire shape --------------

const legacy = normalizeSettings({
  weekShape: { Breakfast: 1, Lunch: 1, Dinner: 2, Snack: 0 },
  dietary: {
    caloriesPerMealMin: 450,
    caloriesPerMealMax: 550,
    proteinFloorGrams: 25,
    fiberFloorGrams: 8,
    maxCookMinutes: 30,
    servingsPerDinner: 2,
    proteins: ["Chicken"],
    cuisines: ["Thai"],
    avoid: ["Pineapple"],
    notes: "no people key at all",
  },
});

assert.deepEqual(legacy.people, [], "a settings blob with no people key normalizes cleanly");
assert.equal(legacy.completedOnboardingAt, null);
assert.equal(legacy.dietary.servingsPerDinner, 2);
assert.deepEqual(legacy.dietary.goals, [], "missing goals defaults to empty");

// Garbage in the people slot degrades to empty rather than throwing.
assert.deepEqual(normalizeSettings({ people: "nope" }).people, []);
assert.deepEqual(normalizeSettings({ people: [null, 42] }).people.length, 2);

// completedOnboardingAt only accepts a non-empty string.
assert.equal(normalizeSettings({ completedOnboardingAt: "   " }).completedOnboardingAt, null);
assert.equal(
  normalizeSettings({ completedOnboardingAt: "2026-07-27T00:00:00.000Z" }).completedOnboardingAt,
  "2026-07-27T00:00:00.000Z"
);

// --- Goal presets -----------------------------------------------------------

const base = DEFAULT_SETTINGS.dietary;

assert.equal(applyGoalPresets(base, []).proteinFloorGrams, base.proteinFloorGrams);
assert.equal(applyGoalPresets(base, ["more-protein"]).proteinFloorGrams, 40);
assert.equal(applyGoalPresets(base, ["more-fiber"]).fiberFloorGrams, 12);
assert.equal(applyGoalPresets(base, ["more-leftovers"]).servingsPerDinner, 6);

const lighter = applyGoalPresets(base, ["lighter-dinners"]);
assert.equal(lighter.caloriesPerMealMin, 400);
assert.equal(lighter.caloriesPerMealMax, 600);

// Later presets win, so the tighter time ceiling survives when both are picked.
assert.equal(
  applyGoalPresets(base, ["stop-eating-out", "faster-weeknights"]).maxCookMinutes,
  25
);

// An unknown goal id is ignored rather than throwing.
assert.deepEqual(applyGoalPresets(base, ["not-a-goal"]), base);

// Suggestions list only the fields that would actually change.
const suggestions = describeGoalSuggestions(base, ["more-protein"]);
assert.equal(suggestions.length, 1);
assert.deepEqual(suggestions[0], {
  label: "Protein floor (g)",
  field: "proteinFloorGrams",
  from: 30,
  to: 40,
});
assert.deepEqual(
  describeGoalSuggestions(applyGoalPresets(base, ["more-protein"]), ["more-protein"]),
  [],
  "already-applied goals suggest nothing"
);

assert.ok(GOAL_PRESETS.length > 0);
assert.equal(
  new Set(GOAL_PRESETS.map((preset) => preset.id)).size,
  GOAL_PRESETS.length,
  "goal ids are unique"
);

// --- Chip suggestions -------------------------------------------------------

// Chips and typed text edit one list, so membership has to ignore capitalization.
assert.ok(listIncludes(["Mushrooms"], "mushrooms"));
assert.ok(listIncludes(["  cilantro "], "Cilantro"));
assert.ok(!listIncludes(["Mushroom"], "Mushrooms"), "no fuzzy matching — singular is a different word");
assert.ok(!listIncludes([], "Anything"));

// Toggling on appends; toggling off removes regardless of how it was typed.
assert.deepEqual(toggleInList(["Beef"], "Mushrooms"), ["Beef", "Mushrooms"]);
assert.deepEqual(toggleInList(["Beef", "Mushrooms"], "Mushrooms"), ["Beef"]);
assert.deepEqual(
  toggleInList(["beef", "MUSHROOMS"], "Mushrooms"),
  ["beef"],
  "a chip clears a differently-capitalized entry someone typed"
);

// Order of the untouched entries is preserved, so the text field does not reshuffle
// under the cursor when a chip is tapped.
assert.deepEqual(toggleInList(["A", "B", "C"], "B"), ["A", "C"]);

// Every suggestion catalog is non-empty and free of duplicates, since a duplicate would
// render two chips that fight over the same entry.
for (const [name, list] of [
  ["FOOD_SUGGESTIONS", FOOD_SUGGESTIONS],
  ["ALLERGY_SUGGESTIONS", ALLERGY_SUGGESTIONS],
  ["CUISINE_SUGGESTIONS", CUISINE_SUGGESTIONS],
  ["PERSON_GOAL_SUGGESTIONS", PERSON_GOAL_SUGGESTIONS],
  ["PROTEIN_SUGGESTIONS", PROTEIN_SUGGESTIONS],
] as const) {
  assert.ok(list.length > 0, `${name} is empty`);
  const keys = list.map((entry) => entry.trim().toLowerCase());
  assert.equal(new Set(keys).size, keys.length, `${name} has a duplicate`);
  assert.ok(
    list.every((entry) => entry.trim() === entry && entry.length > 0),
    `${name} has a blank or untrimmed entry`
  );
}

// A chip tapped into a hard-no list must still beat the other person's love.
const chipDrivenNeverEat = reconcilePeople([
  person({ id: "a", name: "A", loves: ["Mushrooms"] }),
  person({ id: "b", name: "B", neverEat: toggleInList([], "Mushrooms") }),
]);
assert.deepEqual(chipDrivenNeverEat.neverUse, ["Mushrooms"]);
assert.deepEqual(chipDrivenNeverEat.everyoneLoves, []);
assert.deepEqual(chipDrivenNeverEat.contested, []);

// --- Planning brief ---------------------------------------------------------

const settingsWithPeople: HouseholdSettings = normalizeSettings({
  people: [tristan, marisa],
  dietary: { ...DEFAULT_SETTINGS.dietary, goals: ["Stop eating out"] },
});
const brief = describeSettings(settingsWithPeople);

assert.ok(brief.includes("Tristan"), "the brief names each person");
assert.ok(brief.includes("Marisa"));
assert.ok(brief.includes("ALLERGIC TO Shrimp"), "allergies are called out unmistakably");
assert.ok(brief.includes("Never use"), "hard nos reach the brief");
assert.ok(brief.includes("Split"), "contested foods reach the brief");
assert.ok(brief.includes("Household goals: Stop eating out."));

// With nobody filled in, the brief is still valid and just omits the people section.
const bareBrief = describeSettings(DEFAULT_SETTINGS);
assert.ok(bareBrief.includes("Week shape:"));
assert.ok(!bareBrief.includes("Who is eating:"));

console.log("settings tests passed");
