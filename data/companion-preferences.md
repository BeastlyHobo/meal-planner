# Junk List Preferences

> Referenced by: `data/data_context.md`, `data/meal-plan-skill.md`, `data/MEAL_PLAN_PRODUCTION_WORKFLOW.md`

The junk list rides along with each week's plan and flows onto the shopping list like
everything else. It exists so the fun stuff is a deliberate, bounded choice instead of an
impulse grab in the aisle.

Junk items are routed by the same store rules as meal ingredients, so most land on the
Sprouts list. Bulk snacks (a warehouse box of bars, a case of sparkling water) route to
Costco on their own.

**Edit this file to match your household.** What follows is a starting point.

---

## General approach

- Rotate. Avoid the exact same product two weeks running when you can.
- One item per category is plenty. The list is a treat, not a second shop.
- Seasonal and new-to-you beats the standby when both look good.

---

## Categories

Use these exact strings, in this order — the validator checks them:

1. `Coffee/Creamer`
2. `Beer/Wine`
3. `Chips`
4. `Sweets`
5. `Frozen Food`
6. `Frozen Treats`
7. `Beverages/Drinks`

A category may be empty (`"items": []`), but it must be present and in order.

---

### Coffee/Creamer

Whole bean coffee comes from Costco monthly and lives on the staples list, so this
category is usually just creamer. Rotate flavors; skip the weeks you still have some.

### Beer/Wine

Beer: lean hazy IPA and IPA, a good lager in summer. Wine: weight toward reds, with a
white or sparkling for variety. One bottle or one six-pack.

### Chips

One bag. Rotate between tortilla, kettle, and pita styles rather than buying the same bag
every week.

### Sweets

One item. Mix chocolate and non-chocolate week to week.

> The flax seed brownies are a **staple**, not a junk item — they are on the recurring
> Sprouts list in `STAPLES_CATALOG` and do not need to be re-picked each week.

### Frozen Food

One or two quick heat-and-eat meals for the night that gets away from you. This is the
release valve that keeps a bad Tuesday from becoming takeout.

### Frozen Treats

One weekend item. Ice cream, sorbet, mochi, or a savory frozen snack.

### Beverages/Drinks

Flavored unsweetened sparkling water by default. Rotate flavors.

---

## Dislikes

Keep a running list here so the same rejected item does not come back:

- (add yours — e.g. licorice/anise flavors, artificially sweetened snacks, rosé)

---

## Output format

```json
{
  "junkList": [
    { "category": "Coffee/Creamer", "items": [{ "n": "Oat milk creamer", "q": "1 carton" }] },
    { "category": "Beer/Wine", "items": [] },
    { "category": "Chips", "items": [] },
    { "category": "Sweets", "items": [] },
    { "category": "Frozen Food", "items": [] },
    { "category": "Frozen Treats", "items": [] },
    { "category": "Beverages/Drinks", "items": [] }
  ]
}
```

Each item is `{ "n": "product name", "q": "quantity" }`. Add `"store": "costco"` to force
an item onto the warehouse list.
