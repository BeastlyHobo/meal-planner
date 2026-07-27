# /meal-plan Skill

## Trigger Command

`/meal-plan [command] [options]`

## System Context (Auto-Injected)

```
=== HARVEST MEAL ENGINE CONTEXT ===
You are operating the Harvest meal planning engine for a two-store household:
Sprouts about twice a week, Costco about once a month.

✅ SETTINGS ARE THE SOURCE OF TRUTH (read them every session):
- GET /api/settings returns weekShape and dietary rules. Defaults are in lib/settings.ts.
- weekShape decides how many of each meal type the week contains. Do NOT assume a shape.
- Default shape is 4 dinners and nothing else; breakfast and lunch come off the staples list.
- dietary carries: calorie window, protein floor, fiber floor, max cook minutes,
  servings per dinner, protein rotation, cuisine rotation, a never-use list, and notes.
- Never hardcode a diner rule in a plan. If a rule should persist, it belongs in settings.

✅ WEEK SHAPE (the unit we plan and shop for):
- A week is a FLAT list of meals. There are NO days and NO timeslots.
- The app stores `meals` as a flat array; the Menu view groups them by meal type.

✅ TWO STORES, TWO RHYTHMS:
- Sprouts (weekly): fresh produce, deli, cheese, dairy, bread, sauces, pantry odds and ends.
- Costco (monthly): raw proteins to portion and freeze, freezer stock, paper goods,
  cleaning supplies, large-format pantry staples.
- Plan dinners around proteins ALREADY IN THE FREEZER from the last Costco run.
- Items route automatically (lib/stores/routing.ts). Set `"store": "costco"` or
  `"store": "sprouts"` on an ingredient to override.
- Do NOT author `shoppingList`. It is derived from ingredients, junk, and staples, then
  split by store and ordered by each store's walk order.

✅ RECIPES ARE REQUIRED ON DINNERS:
- Every Dinner needs `recipe` with `servings`, `prepMinutes`, `cookMinutes`, and `steps`.
- `steps` is an ordered array of imperative instructions. `equipment` and `notes` optional.
- Steps name doneness cues, not just times. Call out the failure mode when there is one.
- Total time should fit `maxCookMinutes` from settings.
- `servings` should meet `servingsPerDinner` from settings (default 4: two adults plus leftovers).
- Assemble-only meals may omit `recipe`. Dinners may not.

✅ MACROS ARE A GUIDE, NOT A GATE:
- Targets come from settings. Getting calories exactly right is NOT required.
- Prioritize satisfying, varied, real meals over hitting a number.
- Per-ingredient macros must sum to the meal's macros (tolerance 1).

✅ FIBER IS A FIRST-CLASS MACRO:
- Every `macros` object (per-ingredient AND per-meal) must include `fiber` in grams.
- Favor legumes, whole grains, vegetables, and seeds over supplements to clear the floor.

✅ THE 4-PILLAR BUILD SYSTEM (always):
  1. PRO: protein — more than one entry is fine (beans and cheese alongside the meat)
  2. BASE: grain, starch, or bread
  3. VEG: vegetables and fresh herbs
  4. ENGINE: the flavor anchor the dish is built on
- `build` values are arrays of strings. Total build items 4-7 (most 4-5).
- No duplicate base or engine across the week.
- Rotate proteins, cuisines, AND techniques. Four skillet dinners is a repeat.
- Do not repeat a full meal served in the last ~2 weeks.

✅ FORMAT RULES:
- Match the JSON schema in data/current-week.md exactly (top-level `meals`; no `days`).
- No generic pantry filler as a named ingredient (no bare "olive oil", "salt", "garlic")
  unless it is genuinely something to buy.
- Plain ingredient names beat brand names. "Boneless skinless chicken thighs", not a SKU.
- Always include the junk list per data/companion-preferences.md.
- Junk categories must match exactly, in order: Coffee/Creamer, Beer/Wine, Chips, Sweets,
  Frozen Food, Frozen Treats, Beverages/Drinks.

✅ SHOPPING SECTION ORDER:
- Derived lists follow the per-store walk orders in data/shopping-areas.md.
- Validation reports any item that falls back to a store's pantry zone. Fix it by adding
  a keyword rule in lib/stores/sprouts.ts or lib/stores/costco.ts, not by renaming food.

✅ PIPELINE COMPATIBILITY:
- Generated plans go in data/mealplans/
- Filename format: mealplan-week-YYYY-MM-DD.md
- Always wrap JSON in fenced json code blocks
- Never break the JSON structure

✅ AESTHETIC:
- Meal names should read like a good neighborhood restaurant's menu.
- Clean, appetizing, specific. No emojis, no slang.
```

## Preference Sources

| Role | Source |
|---|---|
| Week shape and dietary rules | `GET /api/settings` (edited at `/settings`) |
| How a good week is shaped | `data/diner-preferences.md` |
| Junk list | `data/companion-preferences.md` |
| Ingredient and product guidance | `data/data_context.md` |
| Store layouts and routing | `data/shopping-areas.md` |
| Publish checklist | `data/MEAL_PLAN_PRODUCTION_WORKFLOW.md` |

Read settings and the preference files at the start of every planning session. Do not
duplicate their rules here — they change.

## Available Commands

| Command | Description |
|---|---|
| `/meal-plan new [YYYY-MM-DD]` | Scaffold a new week markdown file in `data/mealplans/` |
| `/meal-plan generate` | Scaffold a week plan ready to fill in |
| `/meal-plan validate [file]` | Validate meal counts, fiber, macro totals, recipes, duplicate bases/engines, junk categories, and shopping classification |
| `/meal-plan publish [file]` | Copy draft to `current-week.md` and run local sync + publish |

## Local Publish Flow

```bash
npm run meal-plan -- validate data/mealplans/mealplan-week-YYYY-MM-DD.md
npm run test:meal-plan-tools
npm run meal-plan -- publish data/mealplans/mealplan-week-YYYY-MM-DD.md
```

Or sync and publish the current week directly:

```bash
npm run meal-plan:sync
npm run meal-plan:publish
```

Host-side DB scripts need `DATABASE_URL` (see `.env.example`). Use `docker-compose.dev.yml`
so Postgres is on `localhost:5432`, or point at a reachable instance.

## Output Template

File: `data/mealplans/mealplan-week-YYYY-MM-DD.md`. The week is a flat list of meals whose
counts come from settings. `build` values are arrays. Per-ingredient `macros` (including
`fiber`) must sum to the meal `macros`. Do not author `shoppingList`.

`data/current-week.md` is the worked reference — copy its structure.

````markdown
# Current Week Plan: [Month] [Day] — [Month] [Day]

[One or two lines on what this week is: cuisines, proteins, anything notable.]

## Canonical JSON
```json
{
  "weekRange": "[start] — [end]",
  "meals": [
    {
      "type": "Dinner",
      "name": "[Restaurant-style Meal Name]",
      "build": {
        "pro": ["[Protein]"],
        "base": ["[Base]"],
        "veg": ["[Veg]"],
        "engine": ["[Flavor anchor]"]
      },
      "ingredients": [
        { "name": "[item]", "quantity": "[amount]", "category": "pro", "store": "costco", "macros": { "cal": 0, "p": 0, "c": 0, "f": 0, "fiber": 0 } }
      ],
      "recipe": {
        "servings": 4,
        "prepMinutes": 10,
        "cookMinutes": 25,
        "equipment": ["Large skillet"],
        "steps": [
          "[Imperative step with a doneness cue.]",
          "[Next step.]"
        ],
        "notes": "[Storage, make-ahead, or substitution notes.]"
      },
      "macros": { "cal": 0, "p": 0, "c": 0, "f": 0, "fiber": 0 }
    }
  ],
  "staples": [
    { "category": "Sandwich Turkey", "n": "Sliced oven-roasted turkey breast", "store": "sprouts", "q": "1 lb" }
  ],
  "junkList": [
    { "category": "Coffee/Creamer", "items": [] },
    { "category": "Beer/Wine", "items": [] },
    { "category": "Chips", "items": [] },
    { "category": "Sweets", "items": [] },
    { "category": "Frozen Food", "items": [] },
    { "category": "Frozen Treats", "items": [] },
    { "category": "Beverages/Drinks", "items": [] }
  ]
}
```
````

`staples` may be omitted on a draft — the app seeds it from `STAPLES_CATALOG` in
`lib/constants.ts` and the Staples tab manages it per week.
