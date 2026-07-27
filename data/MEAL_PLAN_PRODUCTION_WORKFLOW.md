# Weekly Plan Workflow

Step-by-step procedure for authoring and publishing a week.

**Related docs:** `data/diner-preferences.md` · `data/companion-preferences.md` · `data/data_context.md` · `data/shopping-areas.md`

---

## Week shape

A week is a flat `meals` array — no days, no timeslots. How many of each meal type comes
from **app settings**, not from this document. The default is **4 dinners** (breakfast and
lunch come off the staples list).

Check the current shape before you author:

```bash
curl -s http://localhost:3000/api/settings | jq .data.settings
```

Every dinner needs a `recipe`. Fiber is a first-class macro on every ingredient and meal.

---

## Pre-flight: backup

Before overwriting the active week:

```bash
cp data/current-week.md data/backup-week-$(date +%Y-%m-%d-%H%M%S).md
```

(`data/backup-week-*.md` is gitignored.)

---

## Step 1: Review recent meals and the freezer

```bash
curl -s http://localhost:3000/api/meals | jq .
```

Avoid repeating meals from the last two weeks. **Then check the freezer** — dinners
should be built around proteins already portioned from the last Costco run.

---

## Step 2: Author the plan

1. Read `data/diner-preferences.md` and `data/companion-preferences.md`
2. Pull settings (above) for the week shape and dietary targets
3. Use `data/data_context.md` for product and ingredient guidance
4. Create a file under `data/mealplans/` or edit `data/current-week.md` directly
5. Keep the fenced JSON block valid
6. Give every dinner a `recipe` with numbered `steps`, `servings`, `prepMinutes`, and `cookMinutes`
7. Mark bulk-store ingredients with `"store": "costco"` when routing would guess wrong
8. Include the junk list with all seven categories, in order
9. Do **not** author `shoppingList` — it is derived

---

## Step 3: Validate, sync, publish

```bash
npm run meal-plan -- validate data/current-week.md
npm run meal-plan:sync
npm run meal-plan:publish
```

Or validate and publish a dated draft in one pass:

```bash
npm run meal-plan -- validate data/mealplans/mealplan-week-YYYY-MM-DD.md
npm run meal-plan -- publish data/mealplans/mealplan-week-YYYY-MM-DD.md
```

Validation prints the derived shopping list grouped by store, so you can eyeball the walk
order before you publish. Confirm in the app at http://localhost:3000/menu.

---

## Checklist

- [ ] Read the diner and junk preference docs
- [ ] Meal counts match the week shape in `/settings`
- [ ] Every dinner has a recipe with steps, servings, and timing
- [ ] Recipes fit the time ceiling (validator warns when they do not)
- [ ] Different protein and cuisine in each dinner
- [ ] No duplicate `base` or `engine` across the week
- [ ] Macros and fiber present; ingredient macros sum to meal macros
- [ ] Nothing on the **never use** list from settings
- [ ] Junk list has all seven categories, in order
- [ ] No shopping-classification fallbacks (or a keyword rule added for each)
- [ ] Sync and publish succeeded
- [ ] UI shows the new week on both store tabs
