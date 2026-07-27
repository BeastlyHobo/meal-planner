import assert from "node:assert/strict";
import {
  classifyShoppingItem,
  classifyShoppingItemForStore,
  resolveItemStore,
  COSTCO_ZONES,
  SPROUTS_ZONES,
} from "@/lib/stores";
import type { StoreKey } from "@/lib/types";

interface ZoneCase {
  itemName: string;
  store: StoreKey;
  expectedZone: string;
  expectedConfidence?: "exact" | "keyword" | "fallback";
}

/** Every Sprouts aisle gets at least one item, so a renamed zone breaks the build. */
const sproutsCases: ZoneCase[] = [
  { itemName: "Green leaf lettuce", store: "sprouts", expectedZone: "Produce — Vegetables" },
  { itemName: "Roma tomatoes", store: "sprouts", expectedZone: "Produce — Vegetables", expectedConfidence: "exact" },
  { itemName: "Blueberries", store: "sprouts", expectedZone: "Produce — Fruit" },
  { itemName: "Fresh cilantro", store: "sprouts", expectedZone: "Fresh Herbs" },
  { itemName: "Bulk rolled oats", store: "sprouts", expectedZone: "Bulk Bins", expectedConfidence: "exact" },
  { itemName: "Sourdough sandwich bread", store: "sprouts", expectedZone: "Bakery & Bread" },
  { itemName: "Sliced oven-roasted turkey breast", store: "sprouts", expectedZone: "Deli & Prepared" },
  { itemName: "Sliced provolone", store: "sprouts", expectedZone: "Cheese" },
  { itemName: "Fresh salmon fillet", store: "sprouts", expectedZone: "Meat & Seafood" },
  { itemName: "Plain Greek yogurt", store: "sprouts", expectedZone: "Dairy & Eggs" },
  { itemName: "Frozen peas", store: "sprouts", expectedZone: "Frozen" },
  { itemName: "Coconut milk", store: "sprouts", expectedZone: "Grocery — Pantry", expectedConfidence: "exact" },
  { itemName: "Tortilla chips", store: "sprouts", expectedZone: "Grocery — Snacks" },
  { itemName: "Flax seed brownies", store: "sprouts", expectedZone: "Grocery — Sweets", expectedConfidence: "exact" },
  { itemName: "Sparkling water", store: "sprouts", expectedZone: "Beverages" },
  { itemName: "Pinot noir", store: "sprouts", expectedZone: "Beer & Wine" },
  { itemName: "Magnesium supplement", store: "sprouts", expectedZone: "Vitamins & Body Care" },
  { itemName: "Kitchen trash bags", store: "sprouts", expectedZone: "Household" },
];

/** Same coverage guarantee for the warehouse layout. */
const costcoCases: ZoneCase[] = [
  { itemName: "Croissants", store: "costco", expectedZone: "Bakery" },
  { itemName: "Olive oil", store: "costco", expectedZone: "Dry Goods & Pantry", expectedConfidence: "exact" },
  { itemName: "Mixed nuts", store: "costco", expectedZone: "Snacks & Sweets" },
  { itemName: "Sparkling water", store: "costco", expectedZone: "Beverages" },
  { itemName: "Paper towels", store: "costco", expectedZone: "Paper & Household", expectedConfidence: "exact" },
  { itemName: "Laundry detergent", store: "costco", expectedZone: "Cleaning & Laundry", expectedConfidence: "exact" },
  { itemName: "Ibuprofen", store: "costco", expectedZone: "Health & Personal Care" },
  { itemName: "Rotisserie chicken", store: "costco", expectedZone: "Deli & Prepared" },
  { itemName: "Boneless skinless chicken thighs", store: "costco", expectedZone: "Meat & Seafood" },
  { itemName: "Eggs", store: "costco", expectedZone: "Dairy & Eggs" },
  { itemName: "Spring mix", store: "costco", expectedZone: "Produce" },
  { itemName: "Frozen berries", store: "costco", expectedZone: "Frozen", expectedConfidence: "exact" },
];

for (const testCase of [...sproutsCases, ...costcoCases]) {
  const classification = classifyShoppingItemForStore(testCase.itemName, testCase.store);

  assert.equal(
    classification.zone,
    testCase.expectedZone,
    `${testCase.itemName} at ${testCase.store} should be in ${testCase.expectedZone}, got ${classification.zone}`
  );

  if (testCase.expectedConfidence) {
    assert.equal(
      classification.confidence,
      testCase.expectedConfidence,
      `${testCase.itemName} should classify with ${testCase.expectedConfidence} confidence`
    );
  }
}

// Every declared zone must be reachable, or the walk order has a dead section.
for (const [zones, cases, storeName] of [
  [SPROUTS_ZONES, sproutsCases, "Sprouts"],
  [COSTCO_ZONES, costcoCases, "Costco"],
] as const) {
  const covered = new Set<string>(cases.map((testCase) => testCase.expectedZone));
  for (const zone of zones) {
    assert.ok(covered.has(zone), `${storeName} zone "${zone}" has no test case.`);
  }
}

interface RoutingCase {
  itemName: string;
  expectedStore: StoreKey;
}

/** Which store an item comes from, before we ask which aisle. */
const routingCases: RoutingCase[] = [
  // Fresh and perishable — the weekly run.
  { itemName: "Green leaf lettuce", expectedStore: "sprouts" },
  { itemName: "Sliced provolone", expectedStore: "sprouts" },
  { itemName: "Flax seed brownies", expectedStore: "sprouts" },
  { itemName: "Fresh cilantro", expectedStore: "sprouts" },
  { itemName: "Plain Greek yogurt", expectedStore: "sprouts" },
  { itemName: "Gochujang", expectedStore: "sprouts" },
  // Deli-counter turkey is ready to eat, so it stays weekly even though it is meat.
  { itemName: "Sliced oven-roasted turkey breast", expectedStore: "sprouts" },
  { itemName: "Rotisserie chicken", expectedStore: "sprouts" },

  // Bulk, freezer, and household — the monthly run.
  { itemName: "Boneless skinless chicken thighs", expectedStore: "costco" },
  { itemName: "Ground beef", expectedStore: "costco" },
  { itemName: "Salmon fillets", expectedStore: "costco" },
  { itemName: "Frozen raw shrimp", expectedStore: "costco" },
  { itemName: "Toilet paper", expectedStore: "costco" },
  { itemName: "Paper towels", expectedStore: "costco" },
  { itemName: "Laundry detergent", expectedStore: "costco" },
  { itemName: "Olive oil", expectedStore: "costco" },
];

for (const testCase of routingCases) {
  assert.equal(
    resolveItemStore(testCase.itemName),
    testCase.expectedStore,
    `${testCase.itemName} should route to ${testCase.expectedStore}`
  );
}

// An explicit store on the item always beats the routing defaults.
assert.equal(resolveItemStore("Boneless skinless chicken thighs", "sprouts"), "sprouts");
assert.equal(resolveItemStore("Green leaf lettuce", "costco"), "costco");
assert.equal(
  classifyShoppingItem("Boneless skinless chicken thighs", "sprouts").zone,
  "Meat & Seafood"
);
assert.equal(classifyShoppingItem("Green leaf lettuce", "costco").store, "costco");
assert.equal(classifyShoppingItem("Green leaf lettuce", "costco").zone, "Produce");

// Unrecognized items land in the store's default aisle rather than disappearing.
const unknown = classifyShoppingItem("Zzzyx flavor powder");
assert.equal(unknown.confidence, "fallback");
assert.equal(unknown.store, "sprouts");
assert.equal(unknown.zone, "Grocery — Pantry");

console.log(
  `Shopping list order tests passed (${sproutsCases.length + costcoCases.length} zone cases, ${routingCases.length} routing cases).`
);
