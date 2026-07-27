import { ListCategory } from "@/lib/types";
import {
  classifyShoppingItem,
  getStore,
  shouldIncludeShoppingItem,
  STORES,
  storeZoneKey,
} from "@/lib/stores";
import type { ShoppingItemClassification, StoreKey } from "@/lib/stores/types";

export { classifyShoppingItem, shouldIncludeShoppingItem, storeZoneKey } from "@/lib/stores";

/**
 * Group a shopping list into per-store walking order.
 *
 * Sections come out ordered store by store (weekly store first), and within a store in
 * that store's physical aisle order. Each returned section carries the `store` it belongs
 * to so the Shop screen can split it into tabs.
 */
export function organizeShoppingListForStoreLayout(
  shoppingList: ListCategory[]
): ListCategory[] {
  const sectionsByKey = new Map<string, ListCategory>();

  for (const store of STORES) {
    for (const zone of store.zones) {
      sectionsByKey.set(storeZoneKey(store.key, zone), {
        category: zone,
        store: store.key,
        items: [],
      });
    }
  }

  for (const categoryGroup of shoppingList) {
    for (const item of categoryGroup.items) {
      if (!shouldIncludeShoppingItem(item.n)) {
        continue;
      }

      const classification = classifyShoppingItem(item.n, item.store ?? categoryGroup.store);
      const section = sectionsByKey.get(
        storeZoneKey(classification.store, classification.zone)
      );

      if (section) {
        section.items.push({ ...item, store: classification.store });
        continue;
      }

      // A rule pointed at a zone the store does not declare — fall back rather than drop.
      const fallbackStore = getStore(classification.store);
      const fallback = sectionsByKey.get(
        storeZoneKey(fallbackStore.key, fallbackStore.defaultZone)
      );

      if (fallback) {
        fallback.items.push({ ...item, store: fallbackStore.key });
      }

      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[ShoppingList] Unknown zone "${classification.zone}" for "${item.n}" in ${classification.store}.`
        );
      }
    }
  }

  return Array.from(sectionsByKey.values()).filter((section) => section.items.length > 0);
}

/** The store an item will be bought from, aisle included. */
export function getItemStoreZone(
  itemName: string,
  explicitStore?: StoreKey | null
): ShoppingItemClassification {
  return classifyShoppingItem(itemName, explicitStore);
}

/** Only the sections belonging to one store, in that store's walking order. */
export function selectStoreSections(
  shoppingList: ListCategory[],
  storeKey: StoreKey
): ListCategory[] {
  return shoppingList.filter((section) => section.store === storeKey);
}
