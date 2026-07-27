"use client";

import { Ban, Heart, Scale, Sparkles } from "lucide-react";
import {
  getReconciledPreferences,
  personHasAnswers,
  totalMealsForWeekShape,
  type HouseholdSettings,
} from "@/lib/settings";
import { MEAL_TYPES } from "@/lib/constants";
import { cardClass } from "@/lib/uiClasses";

/**
 * The reconciliation, read back in plain language.
 *
 * This screen exists so the merge is never a black box: before anything is saved you can
 * see that one person's allergy became a household hard no, and which foods you two
 * disagree about.
 */
export default function ReviewStep({ settings }: { settings: HouseholdSettings }) {
  const reconciled = getReconciledPreferences(settings);
  const answering = settings.people.filter(personHasAnswers);
  const totalMeals = totalMealsForWeekShape(settings.weekShape);
  const plannedTypes = MEAL_TYPES.filter((type) => (settings.weekShape[type] ?? 0) > 0);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-serif text-2xl font-semibold leading-tight text-[var(--foreground)]">
          Here&apos;s what that means
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          {answering.length > 0
            ? "How your answers combine into the rules the planner follows."
            : "Nobody filled in any preferences, so only the numbers below will apply."}
        </p>
      </header>

      {reconciled.neverUse.length > 0 ? (
        <ReviewCard
          icon={<Ban size={14} />}
          tone="terracotta"
          title="Never used"
          body="One of you can't or won't eat these, so they're off the table for both."
          items={reconciled.neverUse}
        />
      ) : null}

      {reconciled.everyoneLoves.length > 0 ? (
        <ReviewCard
          icon={<Heart size={14} />}
          tone="green"
          title="You both love"
          body="These show up often."
          items={reconciled.everyoneLoves}
        />
      ) : null}

      {reconciled.someoneLoves.length > 0 ? (
        <ReviewCard
          icon={<Sparkles size={14} />}
          tone="green"
          title="One of you loves"
          body="Rotated in rather than every week."
          items={reconciled.someoneLoves}
        />
      ) : null}

      {reconciled.contested.length > 0 ? (
        <ReviewCard
          icon={<Scale size={14} />}
          tone="purple"
          title="You disagree"
          body="One loves it, the other doesn't. Planned occasionally, and served so it's easy to leave out."
          items={reconciled.contested}
        />
      ) : null}

      <section className={`p-4 ${cardClass}`}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
          The week
        </h3>
        <p className="mt-2 text-sm text-[var(--foreground)]">
          {totalMeals > 0
            ? `${plannedTypes
                .map((type) => {
                  const count = settings.weekShape[type] ?? 0;
                  return `${count} ${type.toLowerCase()}${count === 1 ? "" : "s"}`;
                })
                .join(", ")} per week.`
            : "No meals planned."}
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          <ReviewStat
            label="Calories per serving"
            value={`${settings.dietary.caloriesPerMealMin}–${settings.dietary.caloriesPerMealMax}`}
          />
          <ReviewStat label="Protein floor" value={`${settings.dietary.proteinFloorGrams}g`} />
          <ReviewStat label="Fiber floor" value={`${settings.dietary.fiberFloorGrams}g`} />
          <ReviewStat label="Time ceiling" value={`${settings.dietary.maxCookMinutes} min`} />
          <ReviewStat
            label="Servings per dinner"
            value={String(settings.dietary.servingsPerDinner)}
          />
        </dl>
      </section>

      <p className="px-1 text-xs leading-relaxed text-[var(--text-muted)]">
        All of this is editable later — the numbers at Settings, the answers by running
        this again.
      </p>
    </div>
  );
}

const toneClass = {
  green: "bg-harvest-green/10 text-harvest-green",
  terracotta: "bg-harvest-terracotta/10 text-harvest-terracotta",
  purple: "bg-harvest-purple/10 text-harvest-purple",
} as const;

function ReviewCard({
  icon,
  tone,
  title,
  body,
  items,
}: {
  icon: React.ReactNode;
  tone: keyof typeof toneClass;
  title: string;
  body: string;
  items: string[];
}) {
  return (
    <section className={`p-4 ${cardClass}`}>
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-lg ${toneClass[tone]}`}
        >
          {icon}
        </span>
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-muted)]">{body}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${toneClass[tone]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ReviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="shrink-0 font-semibold tabular-nums text-[var(--foreground)]">{value}</dd>
    </div>
  );
}
