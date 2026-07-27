/**
 * System-wide constants for Harvest.
 * Single source of truth for values that are not user-editable settings.
 *
 * Week shape and dietary rules are NOT here — they live in the database and are edited
 * at /settings. See lib/settings.ts.
 */

import type { MealType, StapleItem } from "@/lib/types";

// Meal Type Ordering
export const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack"
] as const satisfies readonly MealType[];

export const MEAL_TYPE_ORDER = [
  "breakfast",
  "lunch",
  "dinner",
  "snack"
] as const;

export const STAPLES_SECTION = "Staples" as const;

/**
 * The things you buy without re-deciding.
 *
 * Sprouts staples ride along on every weekly run; Costco staples ride along on the
 * monthly warehouse trip. `category` is the stable key (what you'd call the slot);
 * `n` is the product name that lands on the shopping list. Edit freely — this is a
 * household's list, not a catalog of anything official.
 */
export const STAPLES_CATALOG: readonly StapleItem[] = [
  // ---- Sprouts, every week ----
  { category: "Sandwich Turkey", n: "Sliced oven-roasted turkey breast", store: "sprouts", q: "1 lb" },
  { category: "Sandwich Cheese", n: "Sliced provolone or cheddar", store: "sprouts", q: "1/2 lb" },
  { category: "Sandwich Bread", n: "Sourdough or whole grain sandwich bread", store: "sprouts", q: "1 loaf" },
  { category: "Lettuce", n: "Green leaf lettuce", store: "sprouts", q: "1 head" },
  { category: "Salad Greens", n: "Spring mix", store: "sprouts", q: "1 box" },
  { category: "Tomatoes", n: "Roma tomatoes", store: "sprouts", q: "4" },
  { category: "Avocados", n: "Avocados", store: "sprouts", q: "3" },
  { category: "Bananas", n: "Bananas", store: "sprouts", q: "1 bunch" },
  { category: "Berries", n: "Blueberries", store: "sprouts", q: "1 pint" },
  { category: "Greek Yogurt", n: "Plain Greek yogurt", store: "sprouts", q: "32 oz" },
  { category: "Hummus", n: "Hummus", store: "sprouts", q: "1 tub" },
  { category: "Flax Brownies", n: "Flax seed brownies", store: "sprouts", q: "1 package" },

  // ---- Costco, every month ----
  { category: "Toilet Paper", n: "Toilet paper", store: "costco", q: "1 pack" },
  { category: "Paper Towels", n: "Paper towels", store: "costco", q: "1 pack" },
  { category: "Trash Bags", n: "Kitchen trash bags", store: "costco", q: "1 box" },
  { category: "Laundry Detergent", n: "Laundry detergent", store: "costco", q: "1 jug" },
  { category: "Dishwasher Pods", n: "Dishwasher pods", store: "costco", q: "1 tub" },
  { category: "Eggs", n: "Eggs", store: "costco", q: "24 count" },
  { category: "Chicken Thighs", n: "Boneless skinless chicken thighs", store: "costco", q: "6 lb, portion and freeze" },
  { category: "Ground Beef", n: "Ground beef", store: "costco", q: "4 lb, portion and freeze" },
  { category: "Salmon", n: "Salmon fillets", store: "costco", q: "3 lb, portion and freeze" },
  { category: "Shrimp", n: "Frozen raw shrimp", store: "costco", q: "2 lb bag" },
  { category: "Olive Oil", n: "Olive oil", store: "costco", q: "1 bottle" },
  { category: "Rice", n: "Jasmine rice", store: "costco", q: "1 bag" },
  { category: "Coffee", n: "Whole bean coffee", store: "costco", q: "1 bag" },
];

// Junk category ordering
export const JUNK_CATEGORY_ORDER = [
  "Coffee/Creamer",
  "Beer/Wine",
  "Chips",
  "Sweets",
  "Frozen Food",
  "Frozen Treats",
  "Beverages/Drinks"
] as const;

// Brand Colors (matching Tailwind config)
export const COLORS = {
  HARVEST_GREEN: "#2d5a27",
  HARVEST_GOLD: "#f0c05a",
  HARVEST_TERRACOTTA: "#cd664d",
  HARVEST_PURPLE: "#6b5b95",
  BACKGROUND: "#fdfcf8"
} as const;

// Database Constants
export const DB_CONSTANTS = {
  MAX_CONNECTIONS: 10,
  IDLE_TIMEOUT: 45000,
  CONNECTION_TIMEOUT: 20000
} as const;

// UI Constants
export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768,
  DEFAULT_PAGE_SIZE: 50,
  MAX_HEART_DISPLAY: 99
} as const;
