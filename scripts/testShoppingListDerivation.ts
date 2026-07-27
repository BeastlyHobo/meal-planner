import assert from "node:assert/strict";
import { deriveShoppingListFromMeals } from "@/lib/domain/shoppingListDerivation";
import { selectStoreSections } from "@/lib/shoppingListOrder";
import { COSTCO_ZONES, SPROUTS_ZONES } from "@/lib/stores";
import type { ListCategory, MealInput, StapleItem, StoreKey } from "@/lib/types";

function meal(
  name: string,
  ingredients: Array<string | { name: string; store: StoreKey }>
): MealInput {
  return {
    type: "Dinner",
    name,
    build: { pro: [], base: [], veg: [], engine: [] },
    ingredients: ingredients.map((ingredient) => {
      const { name: ingredientName, store } =
        typeof ingredient === "string"
          ? { name: ingredient, store: undefined as StoreKey | undefined }
          : ingredient;

      return {
        name: ingredientName,
        quantity: "1",
        category: "pro" as const,
        macros: { cal: 0, p: 0, c: 0, f: 0, fiber: 0 },
        ...(store ? { store } : {}),
      };
    }),
    macros: { cal: 0, p: 0, c: 0, f: 0, fiber: 0 },
  };
}

function itemNames(list: ListCategory[]) {
  return list.flatMap((category) => category.items.map((item) => item.n)).sort();
}

// --- Orphan handling -------------------------------------------------------

const mealA = meal("Meal A", ["Eggs", "Baby spinach"]);
const mealB = meal("Meal B", ["Eggs", "Jasmine rice"]);

const previousList = deriveShoppingListFromMeals([mealA, mealB], [], []);
const withOrphans = deriveShoppingListFromMeals([mealB], previousList, []);
const pruned = deriveShoppingListFromMeals([mealB], previousList, [], [], {
  pruneOrphans: true,
});

// Without pruning, an item from a dropped meal stays on the list (you may still want it).
assert.deepEqual(itemNames(withOrphans), ["Baby spinach", "Eggs", "Jasmine rice"]);
assert.deepEqual(itemNames(pruned), ["Eggs", "Jasmine rice"]);

// --- Store routing ---------------------------------------------------------

const twoStoreMeal = meal("Sheet Pan Chicken", [
  "Boneless skinless chicken thighs",
  "Green leaf lettuce",
  "Roma tomatoes",
]);

const twoStoreList = deriveShoppingListFromMeals([twoStoreMeal], [], []);
const sproutsSections = selectStoreSections(twoStoreList, "sprouts");
const costcoSections = selectStoreSections(twoStoreList, "costco");

assert.deepEqual(itemNames(sproutsSections), ["Green leaf lettuce", "Roma tomatoes"]);
assert.deepEqual(itemNames(costcoSections), ["Boneless skinless chicken thighs"]);
assert.ok(
  twoStoreList.every((section) => section.items.every((item) => item.store === section.store)),
  "every item should carry the store of the section it lands in"
);

// An explicit store on an ingredient overrides routing.
const overrideList = deriveShoppingListFromMeals(
  [meal("Override", [{ name: "Boneless skinless chicken thighs", store: "sprouts" }])],
  [],
  []
);
assert.deepEqual(itemNames(selectStoreSections(overrideList, "sprouts")), [
  "Boneless skinless chicken thighs",
]);
assert.equal(selectStoreSections(overrideList, "costco").length, 0);

// --- Walking order ---------------------------------------------------------

// Sections come back in per-store walking order, weekly store first.
const orderedStores = twoStoreList.map((section) => section.store);
assert.deepEqual(
  orderedStores,
  [...orderedStores].sort((a, b) => (a === b ? 0 : a === "sprouts" ? -1 : 1)),
  "all Sprouts sections should precede all Costco sections"
);

for (const [storeKey, zones] of [
  ["sprouts", SPROUTS_ZONES],
  ["costco", COSTCO_ZONES],
] as const) {
  const sections = selectStoreSections(twoStoreList, storeKey);
  const indices = sections.map((section) =>
    (zones as readonly string[]).indexOf(section.category)
  );
  assert.ok(
    indices.every((index, i) => index !== -1 && (i === 0 || index > indices[i - 1])),
    `${storeKey} sections should follow that store's declared walk order`
  );
}

// --- Staples ---------------------------------------------------------------

const staples: StapleItem[] = [
  { category: "Sandwich Turkey", n: "Sliced oven-roasted turkey breast", store: "sprouts", q: "1 lb" },
  { category: "Toilet Paper", n: "Toilet paper", store: "costco", q: "1 pack" },
];

const withStaples = deriveShoppingListFromMeals([mealB], [], [], staples);

const turkey = withStaples
  .flatMap((section) => section.items)
  .find((item) => item.n === "Sliced oven-roasted turkey breast");
const toiletPaper = withStaples
  .flatMap((section) => section.items)
  .find((item) => item.n === "Toilet paper");

assert.equal(turkey?.shoppingSource, "staple");
assert.equal(turkey?.store, "sprouts");
assert.equal(turkey?.q, "1 lb");
assert.equal(toiletPaper?.shoppingSource, "staple");
assert.equal(toiletPaper?.store, "costco");

// Staples drop off when removed from the week, even without pruneOrphans: they are not
// orphaned meal ingredients, they are a list the user just edited.
const withoutStaples = deriveShoppingListFromMeals([mealB], withStaples, [], []);
assert.ok(!itemNames(withoutStaples).includes("Toilet paper"));

// --- Preserved shopper state ----------------------------------------------

const checkedList = deriveShoppingListFromMeals(
  [mealB],
  [
    {
      category: "Paper & Household",
      store: "costco",
      items: [{ n: "Toilet paper", checked: true, shoppingSource: "staple", store: "costco" }],
    },
  ],
  [],
  staples
);

const checkedToiletPaper = checkedList
  .flatMap((section) => section.items)
  .find((item) => item.n === "Toilet paper");

assert.equal(checkedToiletPaper?.checked, true, "checked state should survive re-derivation");

// Items named "leftover ..." are eaten, not bought.
const withLeftovers = deriveShoppingListFromMeals(
  [meal("Leftovers", ["Leftover roast chicken", "Green leaf lettuce"])],
  [],
  []
);
assert.deepEqual(itemNames(withLeftovers), ["Green leaf lettuce"]);

console.log("shopping list derivation tests passed");
