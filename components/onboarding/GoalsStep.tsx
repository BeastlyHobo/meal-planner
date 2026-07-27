"use client";

import { Check, Wand2 } from "lucide-react";
import {
  describeGoalSuggestions,
  GOAL_PRESETS,
  type DietarySettings,
} from "@/lib/settings";
import { TextAreaField } from "@/components/settings/Fields";
import { cardClass } from "@/lib/uiClasses";

/**
 * Goals, and the numbers they suggest.
 *
 * Selecting a goal changes nothing on its own — the suggested targets are shown as a
 * concrete before/after and applied only when asked. A planner that quietly retargets
 * your calories is a planner you stop trusting.
 */
export default function GoalsStep({
  dietary,
  selectedGoalIds,
  householdNotes,
  onToggleGoal,
  onApplySuggestions,
  onNotesChange,
}: {
  dietary: DietarySettings;
  selectedGoalIds: string[];
  householdNotes: string;
  onToggleGoal: (id: string) => void;
  onApplySuggestions: () => void;
  onNotesChange: (value: string) => void;
}) {
  const suggestions = describeGoalSuggestions(dietary, selectedGoalIds);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-serif text-2xl font-semibold leading-tight text-[var(--foreground)]">
          What are you going for?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          Pick any that fit. Nothing changes until you apply it.
        </p>
      </header>

      <section className={`p-4 ${cardClass}`}>
        <div className="space-y-2">
          {GOAL_PRESETS.map((preset) => {
            const isSelected = selectedGoalIds.includes(preset.id);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onToggleGoal(preset.id)}
                aria-pressed={isSelected}
                className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                  isSelected
                    ? "border-harvest-green/40 bg-harvest-green/10"
                    : "border-[var(--border-subtle)] bg-[var(--tint-stone)] dark:bg-[var(--surface-2)]"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                    isSelected
                      ? "border-transparent bg-harvest-green text-white"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  {isSelected ? <Check size={13} strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--foreground)]">
                    {preset.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--text-muted)]">
                    {preset.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {suggestions.length > 0 ? (
        <section className={`p-4 ${cardClass}`}>
          <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
            Suggested targets
          </h3>
          <ul className="mt-3 space-y-1.5">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.field}
                className="flex items-baseline justify-between gap-3 text-sm"
              >
                <span className="text-[var(--text-muted)]">{suggestion.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-[var(--foreground)]">
                  {suggestion.from} <span className="text-[var(--text-muted)]">→</span>{" "}
                  {suggestion.to}
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onApplySuggestions}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-harvest-green px-4 py-3 text-sm font-semibold text-white"
          >
            <Wand2 size={15} />
            Apply these
          </button>
        </section>
      ) : selectedGoalIds.length > 0 ? (
        <p className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-xs leading-relaxed text-[var(--text-muted)]">
          Your targets already match these goals — nothing to change. The goals still go
          into the plan as context.
        </p>
      ) : null}

      <section className={`p-4 ${cardClass}`}>
        <TextAreaField
          label="Anything else about how you want to eat"
          hint="Goes straight into the planning brief."
          value={householdNotes}
          rows={5}
          placeholder="We want to stop ordering out on weeknights. Sunday can be a longer cook if it's worth it."
          onChange={onNotesChange}
        />
      </section>
    </div>
  );
}
