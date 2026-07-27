"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, RotateCcw, Undo2, X } from "lucide-react";
import { STAPLES_CATALOG } from "@/lib/constants";
import { useListMutations } from "@/lib/hooks/useListMutations";
import { STORES } from "@/lib/stores";
import { StapleItem } from "@/lib/types";

/**
 * The things you buy without re-deciding, grouped by the store they come from.
 *
 * Staples flow straight onto the shopping list every week, so this panel is about
 * dropping one for a week (you still have turkey) rather than composing a list.
 */
export default function StaplesPanel({
  data,
  weekRange,
  onUpdate,
}: {
  data: StapleItem[];
  weekRange?: string;
  onUpdate?: () => void | Promise<void>;
}) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [recentlyDeleted, setRecentlyDeleted] = useState<StapleItem | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const {
    isSaving,
    mutationError,
    resetMutationState,
    deleteItem,
    addItem,
  } = useListMutations({ type: "staple", weekRange, onUpdate });

  const availableOptions = useMemo(
    () =>
      STAPLES_CATALOG.filter(
        (entry) => !data.some((item) => item.category === entry.category)
      ),
    [data]
  );

  const groups = useMemo(
    () =>
      STORES.map((store) => ({
        store,
        items: data.filter((item) => item.store === store.key),
      })).filter((group) => group.items.length > 0),
    [data]
  );

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedCategory("");
      resetMutationState();
    });
  }, [data, resetMutationState, weekRange]);

  useEffect(() => {
    if (!recentlyDeleted) return;
    const timer = setTimeout(() => setRecentlyDeleted(null), 6000);
    return () => clearTimeout(timer);
  }, [recentlyDeleted]);

  async function handleAdd() {
    if (!selectedCategory) return;
    const saved = await addItem(selectedCategory);
    if (saved) {
      setSelectedCategory("");
    }
  }

  async function removeItem(item: StapleItem) {
    await deleteItem(item.category);
    setRecentlyDeleted(item);
  }

  async function undoDelete() {
    if (!recentlyDeleted) return;
    const restored = await addItem(recentlyDeleted.category);
    if (restored) {
      setRecentlyDeleted(null);
    }
  }

  async function resetToCatalog() {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await fetch("/api/mealplan/staples", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekRange }),
      });
      await onUpdate?.();
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-4">
      {mutationError ? (
        <div className="rounded-2xl border border-harvest-terracotta/25 bg-harvest-terracotta/10 px-4 py-3 text-sm font-medium text-harvest-terracotta">
          {mutationError}
        </div>
      ) : null}

      {groups.map(({ store, items }) => (
        <section
          key={store.key}
          className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-card)]"
        >
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="text-[11px] font-black uppercase tracking-[0.16em] text-harvest-green">
              {store.name}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {store.cadenceLabel}
            </span>
          </div>

          <div className="divide-y divide-[var(--border-subtle)]">
            {items.map((item) => (
              <div key={item.category} className="flex items-center gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {item.category}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {item.n}
                    {item.q ? ` · ${item.q}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void removeItem(item)}
                  disabled={isSaving}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
                  aria-label={`Remove ${item.category}`}
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ))}

      {groups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-1)] p-5 text-sm text-[var(--text-muted)]">
          No staples on this week. Add one below, or restore the full list.
        </p>
      ) : null}

      <div className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-1)] p-4 shadow-[var(--shadow-card)]">
        {availableOptions.length > 0 ? (
          <div className="flex gap-2">
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)]"
            >
              <option value="">Add staple...</option>
              {availableOptions.map((entry) => (
                <option key={entry.category} value={entry.category}>
                  {entry.category} ({entry.store === "costco" ? "Costco" : "Sprouts"})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleAdd()}
              disabled={isSaving || !selectedCategory}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-harvest-green px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Add
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Every staple is on this week&apos;s list.
          </p>
        )}

        <button
          type="button"
          onClick={() => void resetToCatalog()}
          disabled={isResetting}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--text-muted)] transition hover:bg-[var(--tint-stone)] disabled:opacity-50"
        >
          {isResetting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <RotateCcw size={13} />
          )}
          Restore full list
        </button>

        <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
          Edit the master list in{" "}
          <code className="rounded bg-[var(--tint-stone)] px-1 py-0.5">lib/constants.ts</code>{" "}
          (<code className="rounded bg-[var(--tint-stone)] px-1 py-0.5">STAPLES_CATALOG</code>).
        </p>
      </div>

      {recentlyDeleted ? (
        <div className="fixed inset-x-0 bottom-[150px] z-40 mx-auto flex max-w-md items-center justify-between gap-3 px-4">
          <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-2)] px-4 py-3 shadow-[var(--shadow-elevated)] backdrop-blur">
            <span className="min-w-0 truncate text-sm text-[var(--foreground)]">
              Removed <strong className="font-semibold">{recentlyDeleted.category}</strong>
            </span>
            <button
              type="button"
              onClick={() => void undoDelete()}
              disabled={isSaving}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-harvest-green px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-white disabled:opacity-60"
            >
              <Undo2 size={13} />
              Undo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
