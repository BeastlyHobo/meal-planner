import type { StoreKey } from "@/lib/stores/types";

export type { StoreKey };

export interface Macros {
  cal: number;
  p: number;
  c: number;
  f: number;
  fiber: number;
}

export interface MealIngredient {
  name: string;
  quantity: string;
  category: "pro" | "base" | "veg" | "engine";
  macros: Macros;
  /**
   * Which store this ingredient comes from. Omit to let lib/stores/routing.ts decide
   * (fresh items default to the weekly store; meat and bulk go to the warehouse run).
   */
  store?: StoreKey;
}

/** How to actually cook a meal. Optional — assemble-only meals do not need one. */
export interface Recipe {
  servings: number;
  prepMinutes: number;
  cookMinutes: number;
  /** Pans, sheet trays, appliances. Keep it to what you have to get out. */
  equipment?: string[];
  /** Numbered instructions, in order. */
  steps: string[];
  /** Make-ahead, storage, or substitution notes. */
  notes?: string;
}

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export interface MealBuild {
  pro: string[];
  base: string[];
  veg: string[];
  engine: string[];
}

export interface MealInput {
  type: MealType;
  name: string;
  build: MealBuild;
  ingredients?: MealIngredient[];
  macros: Macros;
  recipe?: Recipe;
}

export interface StoredMeal extends MealInput {
  mealId: number;
  slotOrder: number;
  appearanceCount: number;
  heartCount: number;
  likedForCurrentWeek: boolean;
  lastServedAt: string | null;
}

export type MealPlanCompositionAction = "swap" | "remove" | "add";

export interface MutateMealPlanCompositionInput {
  weekRange: string;
  action: MealPlanCompositionAction;
  slotOrder?: number;
  mealId?: number;
  type?: MealType;
}

/**
 * A recurring item you buy on essentially every run — the turkey, cheese, and lettuce
 * you never re-decide, plus the paper goods on the monthly warehouse trip. Staples are
 * kept per-week so a week can drop one, but they are seeded from STAPLES_CATALOG.
 */
export interface StapleItem {
  /** Stable identity within a store, e.g. "Sandwich Turkey". Used as the list key. */
  category: string;
  /** The actual product name that lands on the shopping list. */
  n: string;
  store: StoreKey;
  q?: string;
}

export interface ListItem {
  n: string;
  q?: string;
  pantry?: boolean;
  checked?: boolean;
  shoppingSource?: "junk" | "staple";
  /** Resolved store for this item; set when the list is organized for store layout. */
  store?: StoreKey;
  // Junk-only enrichment fields (safe to be absent for shopping items)
  junkItemId?: number;
  heartCount?: number;
  likedForCurrentWeek?: boolean;
}

export interface ListCategory {
  category: string;
  /** Which store's layout this section belongs to. Absent on junk lists. */
  store?: StoreKey;
  items: ListItem[];
}

export interface WeekData<TMeal = MealInput> {
  id?: number | string;
  weekRange: string;
  meals: TMeal[];
  shoppingList?: ListCategory[];
  junkList: ListCategory[];
  staples?: StapleItem[];
  feedback?: MealFeedback[];
}

export interface MealFeedback {
  id: number;
  mealPlanId: number;
  mealId: number;
  liked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeekOption {
  id: number;
  weekRange: string;
  displayLabel: string;
  sortValue: number; // YYYYMMDD (week start date) for sorting
  updatedAt: string;
}

export interface StoredMealPlan {
  id: number;
  weekRange: string;
  meals: StoredMeal[];
  shoppingList: ListCategory[];
  junkList: ListCategory[];
  staples: StapleItem[];
  source: string;
  status: string;
  generationContext: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  mealFeedback: MealFeedback[];
}

export interface SaveMealHeartInput {
  mealPlanId: number;
  mealId: number;
  liked: boolean;
}

export interface UpdateMealInput {
  id: number;
  type: MealType;
  name: string;
  build: MealBuild;
  ingredients?: MealIngredient[];
  macros: Macros;
  recipe?: Recipe | null;
}

// Database Row Types
export interface MealPlanRow {
  id: number | string;
  week_range: string;
  plan_data: {
    shoppingList: StoredMealPlan["shoppingList"];
    junkList: StoredMealPlan["junkList"];
    staples?: StoredMealPlan["staples"];
    /** Pre-two-store plans stored household goods separately; read for migration only. */
    householdGoods?: Array<{ category: string; n: string }>;
  };
  source: string;
  status: string;
  generation_context: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface MealRow {
  id: number | string;
  name: string;
  meal_type: MealInput["type"];
  protein: string[];
  base: string[];
  veg: string[];
  engine: string[];
  ingredients: MealIngredient[];
  recipe: Recipe | null;
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams: number;
  heart_count: number;
  appearance_count: number;
  last_served_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MealPlanMealRow extends MealRow {
  slot_order: number;
  meal_id: number | string;
  liked: boolean | null;
}

export interface MealFeedbackRow {
  id: number | string;
  meal_plan_id: number | string;
  meal_id: number | string;
  liked: boolean;
  created_at: Date;
  updated_at: Date;
}
