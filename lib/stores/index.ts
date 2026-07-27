import { costcoStore } from "@/lib/stores/costco";
import { sproutsStore } from "@/lib/stores/sprouts";
import { resolveItemStore } from "@/lib/stores/routing";
import {
  normalizeShoppingItemForClassification,
  ShoppingItemClassification,
  StoreDefinition,
  StoreKey,
} from "@/lib/stores/types";

export * from "@/lib/stores/types";
export { resolveItemStore } from "@/lib/stores/routing";
export { sproutsStore, SPROUTS_ZONES } from "@/lib/stores/sprouts";
export { costcoStore, COSTCO_ZONES } from "@/lib/stores/costco";

/** Every store, in the order they should be presented on the Shop screen. */
export const STORES: readonly StoreDefinition[] = [sproutsStore, costcoStore];

export const STORE_KEYS = STORES.map((store) => store.key);

const STORES_BY_KEY = new Map<StoreKey, StoreDefinition>(
  STORES.map((store) => [store.key, store])
);

/** The store shopped every week. Shopping lists default here. */
export const WEEKLY_STORE_KEY: StoreKey = sproutsStore.key;

/** The store shopped on a longer cycle for bulk and household goods. */
export const BULK_STORE_KEY: StoreKey = costcoStore.key;

export function getStore(key: StoreKey): StoreDefinition {
  const store = STORES_BY_KEY.get(key);
  if (!store) {
    throw new Error(`Unknown store: ${key}`);
  }
  return store;
}

export function isStoreKey(value: unknown): value is StoreKey {
  return typeof value === "string" && STORES_BY_KEY.has(value as StoreKey);
}

/**
 * Place an item inside a specific store's layout.
 *
 * Exact overrides beat keyword rules; keyword rules are checked in declaration order so
 * specific terms must come before general ones. Anything unmatched lands in the store's
 * default zone with `fallback` confidence, which the plan validator surfaces.
 */
export function classifyShoppingItemForStore(
  itemName: string,
  storeKey: StoreKey
): ShoppingItemClassification {
  const store = getStore(storeKey);
  const name = normalizeShoppingItemForClassification(itemName);

  const exactZone = store.exactOverrides.get(name);
  if (exactZone) {
    return { store: storeKey, zone: exactZone, confidence: "exact", matchedTerm: itemName };
  }

  for (const rule of store.keywordRules) {
    if (rule.excludeTerms?.some((term) => name.includes(normalizeShoppingItemForClassification(term)))) {
      continue;
    }

    const matchedTerm = rule.terms.find((term) =>
      name.includes(normalizeShoppingItemForClassification(term))
    );

    if (matchedTerm) {
      return { store: storeKey, zone: rule.zone, confidence: "keyword", matchedTerm };
    }
  }

  return { store: storeKey, zone: store.defaultZone, confidence: "fallback" };
}

/**
 * Route an item to a store and then to an aisle within that store.
 * `explicitStore` (set by the week author) overrides the routing defaults.
 */
export function classifyShoppingItem(
  itemName: string,
  explicitStore?: StoreKey | null
): ShoppingItemClassification {
  return classifyShoppingItemForStore(itemName, resolveItemStore(itemName, explicitStore));
}

/** Ordered `store::zone` keys, used to sort a mixed shopping list into walking order. */
export const STORE_ZONE_ORDER: readonly string[] = STORES.flatMap((store) =>
  store.zones.map((zone) => storeZoneKey(store.key, zone))
);

export function storeZoneKey(storeKey: StoreKey, zone: string) {
  return `${storeKey}::${zone}`;
}

/** Items prefixed "leftover" are eaten, not bought. */
export function shouldIncludeShoppingItem(itemName: string) {
  return !itemName.trim().toLowerCase().startsWith("leftover");
}
