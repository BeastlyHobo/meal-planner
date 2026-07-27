import { ListCategory, ListItem, MealInput, StoredMeal, StapleItem } from "@/lib/types";
import { organizeShoppingListForStoreLayout } from "@/lib/shoppingListOrder";
import { normalizeShoppingName } from "@/lib/domain/shoppingUsage";
import { resolveItemStore } from "@/lib/stores";
import type { StoreKey } from "@/lib/stores/types";

type DerivableMeal = MealInput | StoredMeal;

interface PreservedShoppingItem {
  item: ListItem;
}

/**
 * Build the shopping list from what the week actually needs.
 *
 * Sources, in priority order: meal ingredients, then junk-list items, then staples. Each
 * item is routed to a store and an aisle, so the result is a single list that the Shop
 * screen splits into a weekly run and a bulk run.
 *
 * Per-item state the shopper set (checked, pantry, quantity) is carried over from
 * `previousShoppingList` so re-deriving never wipes progress mid-trip.
 */
export function deriveShoppingListFromMeals(
  meals: DerivableMeal[],
  previousShoppingList: ListCategory[] = [],
  junkList: ListCategory[] = [],
  staples: StapleItem[] = [],
  options?: { pruneOrphans?: boolean }
): ListCategory[] {
  const previousByName = getPreviousItemsByName(previousShoppingList);
  const derivedByName = new Map<string, ListItem>();

  for (const meal of meals) {
    for (const ingredient of getMealIngredients(meal)) {
      const normalizedName = normalizeShoppingName(ingredient.name);
      if (!normalizedName || derivedByName.has(normalizedName)) {
        continue;
      }

      const previous = previousByName.get(normalizedName)?.item;
      derivedByName.set(
        normalizedName,
        buildShoppingItem(ingredient.name, previous, {
          store: resolveItemStore(ingredient.name, ingredient.store),
        })
      );
    }
  }

  for (const junkCategory of junkList) {
    for (const junkItem of junkCategory.items) {
      const itemName = junkItem.n.trim();
      const normalizedName = normalizeShoppingName(itemName);
      if (!normalizedName || derivedByName.has(normalizedName)) {
        continue;
      }

      const previous = previousByName.get(normalizedName)?.item;
      derivedByName.set(
        normalizedName,
        buildShoppingItem(itemName, previous, {
          q: junkItem.q,
          shoppingSource: "junk",
          store: resolveItemStore(itemName, junkItem.store),
        })
      );
    }
  }

  for (const staple of staples) {
    const itemName = staple.n.trim();
    const normalizedName = normalizeShoppingName(itemName);
    if (!normalizedName || derivedByName.has(normalizedName)) {
      continue;
    }

    const previous = previousByName.get(normalizedName)?.item;
    derivedByName.set(
      normalizedName,
      buildShoppingItem(itemName, previous, {
        q: staple.q,
        shoppingSource: "staple",
        store: staple.store,
      })
    );
  }

  if (!options?.pruneOrphans) {
    for (const [normalizedName, preserved] of previousByName) {
      if (
        !derivedByName.has(normalizedName) &&
        preserved.item.shoppingSource !== "junk" &&
        preserved.item.shoppingSource !== "staple"
      ) {
        derivedByName.set(normalizedName, preserved.item);
      }
    }
  }

  return organizeShoppingListForStoreLayout(
    Array.from(derivedByName.values()).map((item) => ({
      category: "",
      store: item.store,
      items: [item],
    }))
  );
}

function buildShoppingItem(
  itemName: string,
  previous?: ListItem,
  options: { q?: string; shoppingSource?: "junk" | "staple"; store?: StoreKey } = {}
): ListItem {
  return {
    n: itemName,
    q: previous?.q ?? options.q,
    pantry: previous?.pantry,
    checked: previous?.checked,
    ...(options.shoppingSource ? { shoppingSource: options.shoppingSource } : {}),
    ...(options.store ? { store: options.store } : {}),
  };
}

interface DerivableIngredient {
  name: string;
  store?: StoreKey;
}

function getMealIngredients(meal: DerivableMeal): DerivableIngredient[] {
  const ingredients = meal.ingredients
    ?.map((ingredient) => ({ name: ingredient.name.trim(), store: ingredient.store }))
    .filter((ingredient) => ingredient.name.length > 0);

  if (ingredients?.length) {
    return ingredients;
  }

  return [
    ...meal.build.pro,
    ...meal.build.base,
    ...meal.build.veg,
    ...meal.build.engine,
  ]
    .filter(Boolean)
    .map((name) => ({ name }));
}

function getPreviousItemsByName(shoppingList: ListCategory[]) {
  const itemsByName = new Map<string, PreservedShoppingItem>();

  for (const category of shoppingList) {
    for (const item of category.items) {
      const normalizedName = normalizeShoppingName(item.n);
      if (!normalizedName || itemsByName.has(normalizedName)) {
        continue;
      }

      itemsByName.set(normalizedName, { item });
    }
  }

  return itemsByName;
}
