import { comparableFoodKey } from "@/lib/settings/people";

/**
 * Tap-to-choose suggestions for the questionnaire and settings screens.
 *
 * These are a shortcut, never a limit — every field they appear on also takes free text,
 * and a chip is just a faster way to type something common. So the lists are curated for
 * *the things households actually disagree about* rather than trying to be a food
 * database: mushrooms, cilantro, and blue cheese earn their place, "carrot" does not.
 *
 * Edit these freely. They are one household's starting point.
 */

/** Foods worth a tap on loves / dislikes / will-not-eat. */
export const FOOD_SUGGESTIONS: readonly string[] = [
  // Proteins
  "Chicken",
  "Beef",
  "Pork",
  "Lamb",
  "Shrimp",
  "Salmon",
  "White fish",
  "Eggs",
  "Tofu",
  "Beans",
  // Vegetables that split a table
  "Mushrooms",
  "Onions",
  "Bell peppers",
  "Broccoli",
  "Brussels sprouts",
  "Cauliflower",
  "Eggplant",
  "Zucchini",
  "Tomatoes",
  "Sweet potato",
  "Kale",
  "Olives",
  "Avocado",
  "Pickles",
  // Flavors and the usual suspects
  "Spicy food",
  "Cilantro",
  "Blue cheese",
  "Goat cheese",
  "Feta",
  "Garlic",
  "Ginger",
  "Curry",
  "Coconut",
  "Anchovy",
  "Liver",
  "Raw fish",
];

/** The major allergens, plus the intolerances that come up most. */
export const ALLERGY_SUGGESTIONS: readonly string[] = [
  "Peanuts",
  "Tree nuts",
  "Shellfish",
  "Fish",
  "Dairy",
  "Eggs",
  "Soy",
  "Gluten",
  "Sesame",
  "Lactose",
];

export const CUISINE_SUGGESTIONS: readonly string[] = [
  "Mediterranean",
  "Mexican",
  "Thai",
  "Indian",
  "Chinese",
  "Japanese",
  "Korean",
  "Vietnamese",
  "Italian",
  "Middle Eastern",
  "Greek",
  "American comfort",
  "Cajun",
  "Caribbean",
];

/** Personal goals, in the words people actually use. */
export const PERSON_GOAL_SUGGESTIONS: readonly string[] = [
  "More protein",
  "More vegetables",
  "Eat out less",
  "Lose weight",
  "Build muscle",
  "More energy",
  "Less bloated after dinner",
  "More variety",
  "Less food waste",
  "Spend less",
];

/** Proteins to rotate a week across. Used on the settings screen. */
export const PROTEIN_SUGGESTIONS: readonly string[] = [
  "Chicken thighs",
  "Chicken breast",
  "Ground beef",
  "Ground turkey",
  "Steak",
  "Pork loin",
  "Shrimp",
  "Salmon",
  "White fish",
  "Eggs",
  "Beans and lentils",
  "Tofu",
];

/** Case-insensitive membership, so "mushrooms" matches a "Mushrooms" chip. */
export function listIncludes(list: readonly string[], item: string): boolean {
  const key = comparableFoodKey(item);
  return list.some((entry) => comparableFoodKey(entry) === key);
}

/**
 * Add or remove an item, preserving the order of everything else.
 *
 * Removal is case-insensitive so tapping a selected chip clears the entry even when it
 * was typed with different capitalization.
 */
export function toggleInList(list: readonly string[], item: string): string[] {
  if (listIncludes(list, item)) {
    const key = comparableFoodKey(item);
    return list.filter((entry) => comparableFoodKey(entry) !== key);
  }

  return [...list, item];
}
