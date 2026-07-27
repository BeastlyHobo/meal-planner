"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Check, Loader2, Minus, Plus, RotateCcw, Users } from "lucide-react";
import { MEAL_TYPES } from "@/lib/constants";
import { saveSettings, useSettings } from "@/lib/hooks/useSettings";
import {
  ALLERGY_SUGGESTIONS,
  CUISINE_SUGGESTIONS,
  DEFAULT_SETTINGS,
  HouseholdSettings,
  PROTEIN_SUGGESTIONS,
  MAX_MEALS_PER_TYPE,
  MIN_MEALS_PER_TYPE,
  getReconciledPreferences,
  personDisplayName,
  personHasAnswers,
  totalMealsForWeekShape,
} from "@/lib/settings";
import type { MealType } from "@/lib/types";
import { ListField, NumberField, TextAreaField } from "@/components/settings/Fields";
import { cardClass, sectionLabelColorClass } from "@/lib/uiClasses";

export default function SettingsPage() {
  const { settings, isLoading, refresh } = useSettings();
  const [draft, setDraft] = useState<HouseholdSettings>(settings);
  const [syncedSettings, setSyncedSettings] = useState<HouseholdSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Adopt server state whenever it arrives or changes, but never while a save is in
  // flight, which would stomp on what the user just typed. Adjusting during render
  // (rather than in an effect) avoids a wasted pass rendering the stale draft.
  if (syncedSettings !== settings && !isSaving) {
    setSyncedSettings(settings);
    setDraft(settings);
  }

  function updateDietary<K extends keyof HouseholdSettings["dietary"]>(
    key: K,
    value: HouseholdSettings["dietary"][K]
  ) {
    setDraft((current) => ({
      ...current,
      dietary: { ...current.dietary, [key]: value },
    }));
    setMessage(null);
  }

  function updateMealCount(type: MealType, delta: number) {
    setDraft((current) => {
      const next = Math.min(
        MAX_MEALS_PER_TYPE,
        Math.max(MIN_MEALS_PER_TYPE, (current.weekShape[type] ?? 0) + delta)
      );
      return {
        ...current,
        weekShape: { ...current.weekShape, [type]: next },
      };
    });
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const saved = await saveSettings(draft);
      setDraft(saved);
      await refresh(saved, { revalidate: false });
      setMessage("Saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  const totalMeals = totalMealsForWeekShape(draft.weekShape);

  return (
    <main className="px-4 pb-12">
      <p className={`mb-5 ${sectionLabelColorClass.green}`}>Settings</p>

      {isLoading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading settings...</p>
      ) : null}

      <WhoIsEatingCard settings={draft} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className={`p-4 ${cardClass}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
            Week shape
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
            How many of each meal a planned week contains. Set breakfast and lunch to zero
            if those come off your staples list instead.
          </p>

          <div className="mt-4 space-y-2">
            {MEAL_TYPES.map((type) => (
              <div
                key={type}
                className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--tint-stone)] px-3 py-2.5 dark:bg-[var(--surface-2)]"
              >
                <span className="text-sm font-semibold text-[var(--foreground)]">{type}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateMealCount(type, -1)}
                    disabled={(draft.weekShape[type] ?? 0) <= MIN_MEALS_PER_TYPE}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-1)] text-[var(--foreground)] disabled:opacity-40"
                    aria-label={`One fewer ${type}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-black tabular-nums text-[var(--foreground)]">
                    {draft.weekShape[type] ?? 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateMealCount(type, 1)}
                    disabled={(draft.weekShape[type] ?? 0) >= MAX_MEALS_PER_TYPE}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-1)] text-[var(--foreground)] disabled:opacity-40"
                    aria-label={`One more ${type}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-xs font-semibold text-[var(--text-muted)]">
            {totalMeals} meal{totalMeals === 1 ? "" : "s"} per week
          </p>
        </section>

        <section className={`p-4 ${cardClass}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
            Targets
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
            Applied loosely. These shape the planning brief and the plan validator; they
            never block a meal.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField
              label="Calories min"
              value={draft.dietary.caloriesPerMealMin}
              onChange={(value) => updateDietary("caloriesPerMealMin", value)}
            />
            <NumberField
              label="Calories max"
              value={draft.dietary.caloriesPerMealMax}
              onChange={(value) => updateDietary("caloriesPerMealMax", value)}
            />
            <NumberField
              label="Protein floor (g)"
              value={draft.dietary.proteinFloorGrams}
              onChange={(value) => updateDietary("proteinFloorGrams", value)}
            />
            <NumberField
              label="Fiber floor (g)"
              value={draft.dietary.fiberFloorGrams}
              onChange={(value) => updateDietary("fiberFloorGrams", value)}
            />
            <NumberField
              label="Max minutes"
              value={draft.dietary.maxCookMinutes}
              onChange={(value) => updateDietary("maxCookMinutes", value)}
            />
            <NumberField
              label="Servings per dinner"
              value={draft.dietary.servingsPerDinner}
              onChange={(value) => updateDietary("servingsPerDinner", value)}
            />
          </div>
        </section>

        <section className={`space-y-4 p-4 ${cardClass}`}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
            Diet
          </h2>

          <ListField
            label="Proteins to rotate"
            hint="Tap or type. Leave empty for no constraint."
            value={draft.dietary.proteins}
            suggestions={PROTEIN_SUGGESTIONS}
            placeholder="Chicken thighs, Salmon, Beans"
            onChange={(value) => updateDietary("proteins", value)}
          />

          <ListField
            label="Cuisines to rotate"
            hint="Tap or type. Leave empty for no constraint."
            value={draft.dietary.cuisines}
            suggestions={CUISINE_SUGGESTIONS}
            placeholder="Mediterranean, Thai, Tex-Mex"
            onChange={(value) => updateDietary("cuisines", value)}
          />

          <ListField
            label="Never use"
            hint="Allergies and hard nos. Everyone's questionnaire answers are folded in here automatically — you can add to this list, but removing someone's allergy means editing their profile."
            value={draft.dietary.avoid}
            suggestions={ALLERGY_SUGGESTIONS}
            placeholder="Cilantro, shellfish"
            onChange={(value) => updateDietary("avoid", value)}
          />

          <TextAreaField
            label="Notes"
            value={draft.dietary.notes}
            rows={5}
            onChange={(value) => updateDietary("notes", value)}
            placeholder="Anything the fields above don't cover — reflux triggers, textures one of you won't eat, how spicy is too spicy."
          />
        </section>

        {error ? (
          <p className="rounded-2xl border border-harvest-terracotta/25 bg-harvest-terracotta/10 px-4 py-3 text-sm font-medium text-harvest-terracotta">
            {error}
          </p>
        ) : null}

        <div className="sticky bottom-4 flex gap-3 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-2)] p-3 shadow-[var(--shadow-elevated)] backdrop-blur">
          <button
            type="button"
            onClick={() => {
              setDraft(DEFAULT_SETTINGS);
              setMessage(null);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--tint-stone)] px-4 py-3 text-sm font-semibold text-[var(--foreground)]"
          >
            <RotateCcw size={15} />
            Defaults
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 rounded-2xl bg-harvest-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Saving
              </span>
            ) : message ? (
              <span className="inline-flex items-center gap-2">
                <Check size={16} />
                {message}
              </span>
            ) : (
              "Save settings"
            )}
          </button>
        </div>
      </form>
    </main>
  );
}

/**
 * Taste lives in the questionnaire, not here. This card shows what it captured and sends
 * you back to edit it, so the numbers page never becomes a second place to record likes.
 */
function WhoIsEatingCard({ settings }: { settings: HouseholdSettings }) {
  const answering = settings.people.filter(personHasAnswers);
  const reconciled = getReconciledPreferences(settings);

  return (
    <section className={`mb-4 p-4 ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
          Who&apos;s eating
        </h2>
        <Link
          href="/onboarding"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-harvest-green/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-harvest-green"
        >
          <Users size={12} />
          {answering.length > 0 ? "Edit" : "Set up"}
        </Link>
      </div>

      {answering.length === 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
          Nobody has filled out the questionnaire yet. It captures each person&apos;s likes,
          dislikes, allergies, and goals, then turns them into the rules below.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {settings.people.map((person, index) => (
              <li key={person.id} className="text-sm">
                <span className="font-semibold text-[var(--foreground)]">
                  {personDisplayName(person, index)}
                </span>
                <span className="text-[var(--text-muted)]">
                  {person.loves.length ? ` · loves ${person.loves.slice(0, 3).join(", ")}` : ""}
                  {person.allergies.length
                    ? ` · allergic to ${person.allergies.join(", ")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>

          {reconciled.contested.length > 0 ? (
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              Split opinion on{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {reconciled.contested.join(", ")}
              </span>{" "}
              — planned occasionally, or made easy to leave out.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
