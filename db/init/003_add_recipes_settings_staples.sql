-- Dinner recipes: servings, prep/cook minutes, equipment, ordered steps, notes.
-- Null means "no recipe" (assemble-only meals), which the UI renders as ingredients only.
ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS recipe JSONB;

-- Household settings: week shape and dietary rules, edited at /settings.
-- Single-row-per-key table; the app reads and writes the 'household' key.
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Staples replace the old household-goods list and carry the store they are bought at,
-- so weekly (Sprouts) and monthly (Costco) staples live in one list.
-- Existing plans stored household goods with no store; every one of them was a bulk-run
-- purchase, so they migrate to 'costco'.
UPDATE meal_plans
SET plan_data = jsonb_set(
      plan_data - 'householdGoods',
      '{staples}',
      COALESCE(
        (
          SELECT jsonb_agg(item || jsonb_build_object('store', 'costco'))
          FROM jsonb_array_elements(plan_data -> 'householdGoods') AS item
        ),
        '[]'::jsonb
      ),
      true
    )
WHERE plan_data ? 'householdGoods'
  AND NOT plan_data ? 'staples';
