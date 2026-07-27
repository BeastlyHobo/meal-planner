import { normalizeShoppingItemForClassification, StoreKey } from "@/lib/stores/types";

/**
 * Which store does an item come from?
 *
 * The weekly store (Sprouts) is the default: fresh food, produce, deli, dairy, bread,
 * and the sauces and pantry odds and ends a week's dinners need.
 *
 * The bulk store (Costco) claims an item when it is something you buy in quantity and
 * keep: raw meat and seafood, freezer stock, paper and cleaning goods, and large-format
 * pantry staples.
 *
 * This is a default, not a verdict. Any ingredient or list item can set `store`
 * explicitly and that always wins — see data/shopping-areas.md.
 */

interface BulkRule {
  terms: readonly string[];
  excludeTerms?: readonly string[];
}

const DEFAULT_STORE: StoreKey = "sprouts";
const BULK_STORE: StoreKey = "costco";

const BULK_RULES: readonly BulkRule[] = [
  {
    // Raw proteins — bought at Costco, portioned, and frozen.
    terms: [
      "chicken thigh", "chicken breast", "chicken tender", "whole chicken", "ground beef",
      "ground turkey", "ground chicken", "ground pork", "steak", "sirloin", "ribeye",
      "brisket", "pork chop", "pork loin", "pork tenderloin", "carne asada", "lamb chop",
      "bacon", "italian sausage", "breakfast sausage", "salmon fillet", "raw shrimp",
      "shrimp", "scallop", "cod fillet", "halibut", "ahi tuna",
    ],
    // Deli-counter and ready-to-eat versions stay on the weekly list.
    excludeTerms: [
      "deli", "sliced", "rotisserie", "smoked salmon", "lox", "cooked", "grilled chicken strips",
      "chicken sausage",
    ],
  },
  {
    // Freezer stock.
    terms: [
      "frozen berries", "frozen broccoli", "frozen green bean", "frozen corn", "frozen pea",
      "frozen vegetable", "frozen shrimp", "frozen salmon", "frozen chicken", "frozen mango",
      "frozen edamame",
    ],
  },
  {
    // Paper, cleaning, and household — the whole reason for the monthly run.
    terms: [
      "paper towel", "toilet paper", "bath tissue", "napkin", "trash bag", "garbage bag",
      "aluminum foil", "parchment paper", "plastic wrap", "storage bag", "ziploc", "zip top",
      "laundry detergent", "dishwasher", "dish soap", "disinfect", "cleaning wipes",
      "batteries", "light bulb",
    ],
  },
  {
    // Large-format pantry staples that keep for months.
    terms: [
      "olive oil", "avocado oil", "canola oil", "coconut oil", "protein powder",
      "bulk rice", "jasmine rice", "basmati rice", "rolled oats", "canned tomatoes",
      "chicken broth", "beef broth", "vegetable broth", "canned tuna", "peanut butter",
      "maple syrup", "raw honey",
    ],
  },
];

/**
 * Decide which store an item comes from.
 *
 * @param itemName  Product or ingredient name.
 * @param explicitStore  An author-supplied store. Always wins when present.
 */
export function resolveItemStore(itemName: string, explicitStore?: StoreKey | null): StoreKey {
  if (explicitStore === "sprouts" || explicitStore === "costco") {
    return explicitStore;
  }

  const name = normalizeShoppingItemForClassification(itemName);
  if (!name) {
    return DEFAULT_STORE;
  }

  for (const rule of BULK_RULES) {
    if (rule.excludeTerms?.some((term) => name.includes(normalizeShoppingItemForClassification(term)))) {
      continue;
    }

    if (rule.terms.some((term) => name.includes(normalizeShoppingItemForClassification(term)))) {
      return BULK_STORE;
    }
  }

  return DEFAULT_STORE;
}
