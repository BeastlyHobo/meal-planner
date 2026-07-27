# Diner Preferences

> Referenced by: `data/data_context.md`, `data/meal-plan-skill.md`, `data/MEAL_PLAN_PRODUCTION_WORKFLOW.md`

**The numbers live in the app, not in this file.** Week shape, calorie window, protein and
fiber floors, cook-time ceiling, servings per dinner, protein rotation, cuisine rotation,
and the never-use list are all edited at **`/settings`** and stored in the database.

Read them with:

```bash
curl -s http://localhost:3000/api/settings | jq .data.settings
```

The defaults are in `lib/settings.ts` (`DEFAULT_SETTINGS`). `describeSettings()` renders
them as a plain-text brief you can paste into a planning session.

This file holds the things that are not numbers — the shape of a good week and the
judgment calls the settings cannot express.

---

## What a week is

A flat list of meals. No days, no timeslots — you decide on Tuesday what Tuesday is.

The default is **four dinners and nothing else**, because breakfast and lunch come off
the recurring staples list rather than being planned. If you want planned breakfasts or
lunches, raise their counts at `/settings` and the Menu grows tabs for them.

Four dinners plus leftovers covers a week for two people without waste. Planning more is
the most common way this app stops getting used.

---

## Two stores, two rhythms

- **Sprouts, about twice a week.** Fresh produce, deli, cheese, dairy, bread, and the
  sauces a week's dinners need.
- **Costco, about once a month.** Raw proteins to portion and freeze, freezer stock,
  paper goods, cleaning supplies, and large-format pantry staples.

**Plan dinners around proteins that are already in the freezer.** A week that sends you
to Costco mid-month has failed. The Costco tab on the Shop screen is the running list for
the next warehouse run, not a list for this week.

---

## Meal structure (four pillars)

| Pillar | Description |
|---|---|
| `pro` | Protein. Can be more than one — beans and cheese alongside the meat both count. |
| `base` | Grain, starch, or bread |
| `veg` | Vegetables and fresh herbs |
| `engine` | The flavor anchor: the sauce, paste, or condiment the dish is built on |

Total build items: 4–7, most weeks 4–5.

**No duplicate `base` or `engine` across a week.** Two rice bowls in one week is the
fastest way to get bored, and the validator enforces it.

---

## Recipes

Every dinner gets a recipe. Not a link, not a vibe — numbered steps you can follow at
6pm without thinking.

- **Steps are imperative and specific.** "Sear 5 to 6 minutes per side until deeply
  browned" beats "cook the chicken."
- **Say what to look for, not just how long.** Doneness cues survive a different pan.
- **Name the failure mode when there is one.** "Wet shrimp will not brown." "A tight O
  means overcooked."
- **Notes cover storage, make-ahead, and substitutions** — the things you want to know
  the second time you cook it, not the first.
- **Fit the time ceiling** (`maxCookMinutes` in settings). Prep plus cook. The validator
  warns when a recipe runs over rather than rejecting it, because a 45-minute braise on a
  40-minute ceiling is your call.

Assemble-only meals do not need a recipe. Dinners always do.

---

## Variety

- **Rotate proteins.** Aim for a different one in each dinner. The roster is in settings.
- **Rotate cuisines.** No repeated cuisine profile within one week.
- **Vary technique too.** Four skillet dinners in a row is a repeat even when the
  ingredients differ. Mix searing, sheet pan, braising, and assembly.
- **Do not repeat a full meal served in the last two weeks.** Hearted meals can come back
  sooner.

---

## Fiber

Fiber is a first-class macro — it shows on every ingredient and every meal card. Best
sources: legumes, whole grains, vegetables, seeds. The floor is in settings; clearing it
usually means adding beans or a second vegetable rather than a supplement.

---

## Avoid

- Boring salads and bland proteins
- Recipes that are really three recipes
- Product-catalogue meals that read like a store ad
- Repeating a base, an engine, or a cuisine inside one week
- Anything on the **never use** list in settings
