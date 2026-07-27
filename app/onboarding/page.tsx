"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2, X } from "lucide-react";
import GoalsStep from "@/components/onboarding/GoalsStep";
import PersonStep from "@/components/onboarding/PersonStep";
import ReviewStep from "@/components/onboarding/ReviewStep";
import { NumberField, TextField } from "@/components/settings/Fields";
import { MEAL_TYPES } from "@/lib/constants";
import { saveSettings, useSettings } from "@/lib/hooks/useSettings";
import {
  applyGoalPresets,
  createPersonProfile,
  GOAL_PRESETS,
  defaultPeople,
  MAX_MEALS_PER_TYPE,
  MAX_PEOPLE,
  MIN_MEALS_PER_TYPE,
  personDisplayName,
  type HouseholdSettings,
  type PersonProfile,
} from "@/lib/settings";
import type { MealType } from "@/lib/types";
import { cardClass } from "@/lib/uiClasses";

/**
 * The questionnaire.
 *
 * Full-screen and outside the normal nav, because it is a linear task rather than a
 * place you browse. Step position lives in the URL so Back works, a refresh keeps you
 * where you were, and a link can drop someone straight into their own section.
 *
 * Nothing is written until the last step. A partially answered questionnaire that gets
 * abandoned leaves the stored settings untouched.
 */

type StepKind = "welcome" | "people" | "person" | "cooking" | "goals" | "review";

interface Step {
  kind: StepKind;
  label: string;
  personIndex?: number;
}

function buildSteps(people: PersonProfile[]): Step[] {
  return [
    { kind: "welcome", label: "Welcome" },
    { kind: "people", label: "Who's eating" },
    ...people.map((person, index) => ({
      kind: "person" as const,
      label: personDisplayName(person, index),
      personIndex: index,
    })),
    { kind: "cooking", label: "How you cook" },
    { kind: "goals", label: "Goals" },
    { kind: "review", label: "Review" },
  ];
}

/** A questionnaire always has at least one person to answer for. */
function withPeople(settings: HouseholdSettings): HouseholdSettings {
  return {
    ...settings,
    people: settings.people.length > 0 ? settings.people : defaultPeople(),
  };
}

function goalIdsFor(settings: HouseholdSettings): string[] {
  return GOAL_PRESETS.filter((preset) => settings.dietary.goals.includes(preset.label)).map(
    (preset) => preset.id
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingFlow />
    </Suspense>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings, refresh } = useSettings();

  const [draft, setDraft] = useState<HouseholdSettings>(() => withPeople(settings));
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>(() =>
    goalIdsFor(settings)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // useSettings resolves to DEFAULT_SETTINGS before the fetch lands, so seeding the draft
  // once on mount would silently discard existing answers when re-running the
  // questionnaire. Adopt server state whenever it changes, but stop the moment someone
  // starts typing — after that the draft is theirs.
  const [syncedSettings, setSyncedSettings] = useState(settings);
  const [isDirty, setIsDirty] = useState(false);

  if (syncedSettings !== settings && !isDirty && !isSaving) {
    setSyncedSettings(settings);
    setDraft(withPeople(settings));
    setSelectedGoalIds(goalIdsFor(settings));
  }

  /** Every draft mutation goes through here so the server-sync guard stays honest. */
  function editDraft(update: (current: HouseholdSettings) => HouseholdSettings) {
    setIsDirty(true);
    setDraft(update);
  }

  const steps = useMemo(() => buildSteps(draft.people), [draft.people]);
  const rawStep = Number(searchParams.get("step") ?? "0");
  const stepIndex = Number.isFinite(rawStep)
    ? Math.min(steps.length - 1, Math.max(0, Math.trunc(rawStep)))
    : 0;
  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function goToStep(nextIndex: number) {
    const clamped = Math.min(steps.length - 1, Math.max(0, nextIndex));
    router.replace(`/onboarding?step=${clamped}`, { scroll: true });
  }

  function updatePerson(index: number, next: PersonProfile) {
    editDraft((current) => ({
      ...current,
      people: current.people.map((person, i) => (i === index ? next : person)),
    }));
  }

  function addPerson() {
    editDraft((current) =>
      current.people.length >= MAX_PEOPLE
        ? current
        : { ...current, people: [...current.people, createPersonProfile("", current.people.length)] }
    );
  }

  function removePerson(index: number) {
    editDraft((current) => ({
      ...current,
      people: current.people.filter((_, i) => i !== index),
    }));
  }

  function updateMealCount(type: MealType, delta: number) {
    editDraft((current) => ({
      ...current,
      weekShape: {
        ...current.weekShape,
        [type]: Math.min(
          MAX_MEALS_PER_TYPE,
          Math.max(MIN_MEALS_PER_TYPE, (current.weekShape[type] ?? 0) + delta)
        ),
      },
    }));
  }

  function toggleGoal(id: string) {
    setIsDirty(true);
    setSelectedGoalIds((current) =>
      current.includes(id) ? current.filter((goalId) => goalId !== id) : [...current, id]
    );
  }

  function applySuggestions() {
    editDraft((current) => ({
      ...current,
      dietary: applyGoalPresets(current.dietary, selectedGoalIds),
    }));
  }

  async function finish(markComplete: boolean) {
    setIsSaving(true);
    setError(null);

    try {
      // Record the picked goals by label so they reach the planning brief whether or not
      // their suggested numbers were ever applied.
      const goals = GOAL_PRESETS.filter((preset) => selectedGoalIds.includes(preset.id)).map(
        (preset) => preset.label
      );

      const saved = await saveSettings({
        ...draft,
        dietary: { ...draft.dietary, goals },
        completedOnboardingAt: markComplete
          ? new Date().toISOString()
          : draft.completedOnboardingAt,
      });
      await refresh(saved, { revalidate: false });
      router.replace("/menu");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save your answers.");
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[var(--surface-0)]">
      <div className="mx-auto min-h-screen max-w-md px-4 pb-32 pt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
              Step {stepIndex + 1} of {steps.length}
            </span>
            <span className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {step.label}
            </span>
          </div>
          <Link
            href="/menu"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-muted)]"
            aria-label="Close the questionnaire"
          >
            <X size={17} />
          </Link>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <div
            className="h-full rounded-full bg-harvest-green transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="mt-6">
          {step.kind === "welcome" ? (
            <WelcomeStep onSkip={() => void finish(true)} isSaving={isSaving} />
          ) : null}

          {step.kind === "people" ? (
            <PeopleStep
              people={draft.people}
              onRename={(index, name) =>
                updatePerson(index, { ...draft.people[index], name })
              }
              onAdd={addPerson}
              onRemove={removePerson}
            />
          ) : null}

          {step.kind === "person" && step.personIndex !== undefined ? (
            <PersonStep
              person={draft.people[step.personIndex]}
              index={step.personIndex}
              onChange={(next) => updatePerson(step.personIndex!, next)}
            />
          ) : null}

          {step.kind === "cooking" ? (
            <CookingStep
              settings={draft}
              onMealCount={updateMealCount}
              onDietaryNumber={(key, value) =>
                editDraft((current) => ({
                  ...current,
                  dietary: { ...current.dietary, [key]: value },
                }))
              }
            />
          ) : null}

          {step.kind === "goals" ? (
            <GoalsStep
              dietary={draft.dietary}
              selectedGoalIds={selectedGoalIds}
              householdNotes={draft.dietary.notes}
              onToggleGoal={toggleGoal}
              onApplySuggestions={applySuggestions}
              onNotesChange={(value) =>
                editDraft((current) => ({
                  ...current,
                  dietary: { ...current.dietary, notes: value },
                }))
              }
            />
          ) : null}

          {step.kind === "review" ? <ReviewStep settings={draft} /> : null}
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-harvest-terracotta/25 bg-harvest-terracotta/10 px-4 py-3 text-sm font-medium text-harvest-terracotta">
            {error}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 pb-safe pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-md gap-3 pb-4">
          <button
            type="button"
            onClick={() => goToStep(stepIndex - 1)}
            disabled={stepIndex === 0 || isSaving}
            className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-[var(--tint-stone)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] disabled:opacity-40 dark:bg-[var(--surface-3)]"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <button
            type="button"
            onClick={() => (isLastStep ? void finish(true) : goToStep(stepIndex + 1))}
            disabled={isSaving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-harvest-green px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving
              </>
            ) : isLastStep ? (
              <>
                <Check size={16} />
                Save and finish
              </>
            ) : (
              <>
                Next
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({ onSkip, isSaving }: { onSkip: () => void; isSaving: boolean }) {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-3xl font-semibold leading-tight text-[var(--foreground)]">
        Let&apos;s make dinner yours
      </h1>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">
        A few questions each, about five minutes. The point is to stop planning dinners
        that one of you quietly doesn&apos;t want.
      </p>

      <section className={`space-y-3 p-4 ${cardClass}`}>
        <WelcomePoint
          title="You each answer separately"
          body="Different palates, different answers. They get merged at the end and you'll see exactly how."
        />
        <WelcomePoint
          title="Hard nos always win"
          body="If one of you can't eat something, it never gets planned — no matter how much the other likes it."
        />
        <WelcomePoint
          title="Nothing is permanent"
          body="Every answer is editable later, and the numbers live on the Settings screen."
        />
      </section>

      <button
        type="button"
        onClick={onSkip}
        disabled={isSaving}
        className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-[var(--text-muted)] underline underline-offset-4 disabled:opacity-50"
      >
        Skip for now
      </button>
    </div>
  );
}

function WelcomePoint({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--foreground)]">{title}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
    </div>
  );
}

function PeopleStep({
  people,
  onRename,
  onAdd,
  onRemove,
}: {
  people: PersonProfile[];
  onRename: (index: number, name: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-serif text-2xl font-semibold leading-tight text-[var(--foreground)]">
          Who&apos;s eating?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          Each person gets their own set of questions next.
        </p>
      </header>

      <section className={`space-y-3 p-4 ${cardClass}`}>
        {people.map((person, index) => (
          <div key={person.id} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label={`Person ${index + 1}`}
                value={person.name}
                placeholder="First name"
                onChange={(value) => onRename(index, value)}
              />
            </div>
            {people.length > 1 ? (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-harvest-terracotta/10 text-harvest-terracotta"
                aria-label={`Remove person ${index + 1}`}
              >
                <Trash2 size={16} />
              </button>
            ) : null}
          </div>
        ))}

        {people.length < MAX_PEOPLE ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[var(--border-subtle)] py-3 text-sm font-semibold text-harvest-green"
          >
            <Plus size={15} />
            Add another person
          </button>
        ) : null}
      </section>
    </div>
  );
}

function CookingStep({
  settings,
  onMealCount,
  onDietaryNumber,
}: {
  settings: HouseholdSettings;
  onMealCount: (type: MealType, delta: number) => void;
  onDietaryNumber: (key: "servingsPerDinner" | "maxCookMinutes", value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-serif text-2xl font-semibold leading-tight text-[var(--foreground)]">
          How you cook
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          How many meals a week get planned, and how much time a weeknight gets.
        </p>
      </header>

      <section className={`p-4 ${cardClass}`}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
          Meals per week
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">
          Leave breakfast and lunch at zero if those come off your staples list.
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
                  onClick={() => onMealCount(type, -1)}
                  disabled={(settings.weekShape[type] ?? 0) <= MIN_MEALS_PER_TYPE}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-1)] text-lg leading-none text-[var(--foreground)] disabled:opacity-40"
                  aria-label={`One fewer ${type}`}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-black tabular-nums text-[var(--foreground)]">
                  {settings.weekShape[type] ?? 0}
                </span>
                <button
                  type="button"
                  onClick={() => onMealCount(type, 1)}
                  disabled={(settings.weekShape[type] ?? 0) >= MAX_MEALS_PER_TYPE}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-1)] text-lg leading-none text-[var(--foreground)] disabled:opacity-40"
                  aria-label={`One more ${type}`}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`grid grid-cols-2 gap-3 p-4 ${cardClass}`}>
        <NumberField
          label="Servings per dinner"
          value={settings.dietary.servingsPerDinner}
          onChange={(value) => onDietaryNumber("servingsPerDinner", value)}
        />
        <NumberField
          label="Max minutes"
          value={settings.dietary.maxCookMinutes}
          onChange={(value) => onDietaryNumber("maxCookMinutes", value)}
        />
      </section>
      <p className="px-1 text-xs leading-relaxed text-[var(--text-muted)]">
        Two adults plus leftovers is usually 4 servings. Max minutes is prep plus cook.
      </p>
    </div>
  );
}
