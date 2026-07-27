"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ListSection from "@/components/ListSection";
import MealPlanGate from "@/components/MealPlanGate";
import { useMealPlan } from "@/lib/MealPlanProvider";
import { getShoppingItemUsage } from "@/lib/domain/shoppingUsage";
import { selectStoreSections } from "@/lib/shoppingListOrder";
import { STORES, WEEKLY_STORE_KEY } from "@/lib/stores";
import type { StoreKey } from "@/lib/types";
import { sectionLabelColorClass } from "@/lib/uiClasses";
import { buildHref } from "@/lib/urlState";

function parseStore(raw: string | null): StoreKey | null {
  return STORES.some((store) => store.key === raw) ? (raw as StoreKey) : null;
}

export default function ShopPage() {
  const { plan, isLoading, error, refresh } = useMealPlan();
  const searchParams = useSearchParams();
  const queryString = useMemo(() => searchParams.toString(), [searchParams]);
  const activeStoreKey = parseStore(searchParams.get("store")) ?? WEEKLY_STORE_KEY;
  const activeStore = STORES.find((store) => store.key === activeStoreKey) ?? STORES[0];

  const shoppingItemUsage = useMemo(
    () => (plan ? getShoppingItemUsage(plan) : {}),
    [plan]
  );

  return (
    <MealPlanGate
      plan={plan}
      isLoading={isLoading}
      error={error}
      loadingMessage="Loading the list..."
      onSeeded={refresh}
    >
      {(readyPlan) => {
        const sectionsByStore = STORES.map((store) => ({
          store,
          sections: selectStoreSections(readyPlan.shoppingList, store.key),
        }));
        const activeSections =
          sectionsByStore.find((entry) => entry.store.key === activeStore.key)?.sections ?? [];

        return (
          <main className="px-4 pb-12">
            <p className={`mb-4 ${sectionLabelColorClass.green}`}>Shopping Run</p>

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
              {sectionsByStore.map(({ store, sections }) => {
                const itemCount = sections.reduce(
                  (sum, section) => sum + section.items.length,
                  0
                );
                const isActive = store.key === activeStore.key;

                return (
                  <Link
                    key={store.key}
                    href={buildHref("/shop", queryString, { store: store.key })}
                    scroll={false}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
                      isActive
                        ? "bg-harvest-green text-white shadow dark:bg-[var(--surface-3)] dark:text-harvest-green dark:shadow-none"
                        : "bg-[var(--card-border)] text-[var(--muted-text)]"
                    }`}
                  >
                    {store.name}
                    <span className="ml-1.5 opacity-70">{itemCount}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mb-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {activeStore.cadenceLabel}
              </p>
              <p className="mt-1 text-sm text-[var(--foreground)]">{activeStore.blurb}</p>
            </div>

            <ListSection
              data={activeSections}
              checklistSeedData={readyPlan.shoppingList}
              colorClass="bg-harvest-green"
              editable={true}
              weekRange={readyPlan.weekRange}
              type="shopping"
              itemUsageByKey={shoppingItemUsage}
              onUpdate={refresh}
            />
          </main>
        );
      }}
    </MealPlanGate>
  );
}
