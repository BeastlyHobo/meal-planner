"use client";

import { useId, useState } from "react";
import { inputClass } from "@/lib/uiClasses";

/**
 * Form primitives shared by /settings and the /onboarding questionnaire.
 *
 * Lists are comma-separated text rather than chip pickers: it is faster to type "she
 * won't touch mushrooms or blue cheese" than to hunt for both in a grid, and it does not
 * constrain answers to a vocabulary someone else chose.
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

export function ListField({
  label,
  hint,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string[];
  placeholder?: string;
  onChange: (value: string[]) => void;
}) {
  const hintId = useId();

  // Keep the raw text local so typing a comma or a trailing space isn't eaten by
  // round-tripping through the array on every keystroke. Re-sync only when the
  // underlying list identity actually changes (a save, or a reset to defaults).
  const [text, setText] = useState(() => value.join(", "));
  const [syncedValue, setSyncedValue] = useState(value);

  if (syncedValue !== value) {
    setSyncedValue(value);
    setText(value.join(", "));
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
    </div>
  );
}
