/**
 * Store model.
 *
 * Harvest plans around two stores with different rhythms:
 *   - a weekly store you walk often (Sprouts, ~2x/week) for fresh and perishable food
 *   - a bulk store you visit occasionally (Costco, ~1x/month) for meat, freezer stock,
 *     and non-perishable household goods
 *
 * Every store defines its own walking order and its own item -> zone rules, because
 * the same product lives in a different place in each store.
 */

export type StoreKey = "sprouts" | "costco";

export type StoreCadence = "weekly" | "monthly";

export interface StoreKeywordRule {
  /** Zone this rule places matching items into. Must be one of the store's `zones`. */
  zone: string;
  /** Lowercase substrings; the first rule with a match wins, so order matters. */
  terms: readonly string[];
  /** If any of these match, the rule is skipped entirely. */
  excludeTerms?: readonly string[];
}

export interface StoreDefinition {
  key: StoreKey;
  /** Display name, e.g. "Sprouts". */
  name: string;
  /** How often this store is shopped, in words: "Twice a week". */
  cadenceLabel: string;
  cadence: StoreCadence;
  /** One-line description shown above the list. */
  blurb: string;
  /**
   * Physical walking order. Reorder this array to match your store — it is the only
   * thing that decides what order sections appear in on the Shop screen.
   */
  zones: readonly string[];
  /** Where unrecognized items land. */
  defaultZone: string;
  /** Exact (normalized) item name -> zone. Beats every keyword rule. */
  exactOverrides: ReadonlyMap<string, string>;
  /** Checked in order; first match wins. Put specific rules before general ones. */
  keywordRules: readonly StoreKeywordRule[];
}

export type ShoppingItemClassificationConfidence = "exact" | "keyword" | "fallback";

export interface ShoppingItemClassification {
  store: StoreKey;
  zone: string;
  confidence: ShoppingItemClassificationConfidence;
  matchedTerm?: string;
}

export function normalizeShoppingItemForClassification(itemName: string) {
  return itemName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function buildExactOverrides(
  entries: readonly (readonly [zone: string, itemNames: readonly string[]])[]
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();

  for (const [zone, itemNames] of entries) {
    for (const itemName of itemNames) {
      map.set(normalizeShoppingItemForClassification(itemName), zone);
    }
  }

  return map;
}
