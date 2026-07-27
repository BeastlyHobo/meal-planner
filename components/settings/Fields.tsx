"use client";

import { useId, useState } from "react";
import { Check } from "lucide-react";
import { listIncludes, toggleInList } from "@/lib/settings/suggestions";
import { inputClass } from "@/lib/uiClasses";

/**
 * Form primitives shared by /settings and the /onboarding questionnaire.
 *
 * Lists are chips *and* text over the same value: tap the common answers, type anything
 * the chips don't cover. Neither is a lesser path — the text input always shows the full
 * list including chip selections, so there is one source of truth and no hidden state.
 *
 * Hints are wired with aria-describedby rather than nested inside the <label>, so a
 * screen reader announces the field as "Foods you love" and offers the hint separately
 * instead of reading one long run-on name.
 */

/** Split comma-separated input into a deduplicated list. */
export function toList(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );
}

export const fieldLabelClass =
  "mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-[var(--text-muted)]";

const fieldHintClass = "mt-1 block text-[11px] leading-relaxed text-[var(--text-muted)]";

function Hint({ id, children }: { id: string; children?: string }) {
  if (!children) {
    return null;
  }
  return (
    <span id={id} className={fieldHintClass}>
      {children}
    </span>
  );
}

export function NumberField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const hintId = useId();

  return (
    <div>
      <label className="block">
        <span className={fieldLabelClass}>{label}</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={value}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          className={inputClass}
        />
      </label>
      <Hint id={hintId}>{hint}</Hint>
    </div>
  );
}

export function TextField({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const hintId = useId();

  return (
    <div>
      <label className="block">
        <span className={fieldLabelClass}>{label}</span>
        <input
          value={value}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
          placeholder={placeholder}
        />
      </label>
      <Hint id={hintId}>{hint}</Hint>
    </div>
  );
}

export function TextAreaField({
  label,
  hint,
  value,
  placeholder,
  rows = 4,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  placeholder?: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  const hintId = useId();

  return (
    <div>
      <label className="block">
        <span className={fieldLabelClass}>{label}</span>
        <textarea
          value={value}
          rows={rows}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} resize-y`}
          placeholder={placeholder}
        />
      </label>
      <Hint id={hintId}>{hint}</Hint>
    </div>
  );
}

/**
 * A list of short values, editable two ways over one array.
 *
 * Pass `suggestions` to get tap-to-choose chips under the input. Chips and text are not
 * separate modes: the input always shows the whole list, tapping a selected chip removes
 * it, and typing something that matches a chip lights that chip up.
 */
export function ListField({
  label,
  hint,
  value,
  suggestions,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  suggestions?: readonly string[];
  placeholder?: string;
  onChange: (value: string[]) => void;
}) {
  const hintId = useId();

  // Keep the raw text local so typing a comma or a trailing space isn't eaten by
  // round-tripping through the array on every keystroke. Re-sync only when the
  // underlying list identity actually changes (a chip tap, a save, a reset).
  const [text, setText] = useState(() => value.join(", "));
  const [syncedValue, setSyncedValue] = useState(value);

  if (syncedValue !== value) {
    setSyncedValue(value);
    setText(value.join(", "));
  }

  // Chips toggle against what is *currently typed*, not the last committed array.
  // Otherwise tapping a chip while the input still holds uncommitted text would
  // silently discard it, since a click's blur and its handler race.
  const pending = toList(text);

  function toggleSuggestion(suggestion: string) {
    onChange(toggleInList(pending, suggestion));
  }

  return (
    <div>
      <label className="block">
        <span className={fieldLabelClass}>{label}</span>
        <input
          value={text}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => setText(event.target.value)}
          // Commit on blur so a half-typed "chick" never becomes a list entry.
          onBlur={() => onChange(toList(text))}
          className={inputClass}
          placeholder={placeholder}
        />
      </label>
      <Hint id={hintId}>{hint}</Hint>

      {suggestions?.length ? (
        <SuggestionChips
          label={label}
          suggestions={suggestions}
          selected={pending}
          onToggle={toggleSuggestion}
        />
      ) : null}
    </div>
  );
}

/** How many chips to show before collapsing behind "Show all". */
const COLLAPSED_CHIP_COUNT = 10;

/**
 * Long catalogs are collapsed by default.
 *
 * Three food fields on one questionnaire step times thirty-odd chips is a wall to scroll
 * past, and the text input already covers anything not shown. Selected chips are always
 * visible regardless of where they fall in the catalog — a collapsed list must never hide
 * an answer someone already gave.
 */
function SuggestionChips({
  label,
  suggestions,
  selected,
  onToggle,
}: {
  label: string;
  suggestions: readonly string[];
  selected: string[];
  onToggle: (suggestion: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const collapsible = suggestions.length > COLLAPSED_CHIP_COUNT;
  const visible =
    !collapsible || isExpanded
      ? suggestions
      : suggestions.filter(
          (suggestion, index) =>
            index < COLLAPSED_CHIP_COUNT || listIncludes(selected, suggestion)
        );
  const hiddenCount = suggestions.length - visible.length;

  return (
    <div
      className="mt-2.5 flex flex-wrap gap-1.5"
      role="group"
      aria-label={`Suggestions for ${label}`}
    >
      {visible.map((suggestion) => {
        const isSelected = listIncludes(selected, suggestion);

        return (
          <button
            key={suggestion}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(suggestion)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition active:scale-95 ${
              isSelected
                ? "border-harvest-green bg-harvest-green/20 font-semibold text-harvest-green"
                : "border-[var(--border-subtle)] bg-[var(--tint-stone)] font-medium text-[var(--text-muted)] dark:bg-[var(--surface-2)]"
            }`}
          >
            {isSelected ? <Check size={11} strokeWidth={3.5} /> : null}
            {suggestion}
          </button>
        );
      })}

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="rounded-full px-2.5 py-1 text-xs font-semibold text-harvest-green underline underline-offset-2"
        >
          +{hiddenCount} more
        </button>
      ) : null}

      {collapsible && isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="rounded-full px-2.5 py-1 text-xs font-semibold text-[var(--text-muted)] underline underline-offset-2"
        >
          Show fewer
        </button>
      ) : null}
    </div>
  );
}
