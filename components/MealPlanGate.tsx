"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { Users } from "lucide-react";
import SeedMealPlanButton from "@/components/SeedMealPlanButton";
import { StoredMealPlan } from "@/lib/types";

interface MealPlanGateProps {
  plan: StoredMealPlan | null;
  isLoading: boolean;
  error: string | null;
  loadingMessage: string;
  onSeeded: () => Promise<void>;
  children: (plan: StoredMealPlan) => ReactNode;
}

export default function MealPlanGate({
  plan,
  isLoading,
  error,
  loadingMessage,
  onSeeded,
  children,
}: MealPlanGateProps) {
  if (isLoading) {
    return <main className="px-4 text-sm text-stone-500">{loadingMessage}</main>;
  }

  if (error) {
    return <main className="px-4 text-sm text-harvest-terracotta">{error}</main>;
  }

  if (!plan) {
    return (
      <main className="px-4 space-y-3">
        <SeedMealPlanButton onSeeded={onSeeded} />
        <Link
          href="/onboarding"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)] px-4 py-3 text-sm font-semibold text-harvest-green"
        >
          <Users size={15} />
          Set up your preferences
        </Link>
      </main>
    );
  }

  return <>{children(plan)}</>;
}
