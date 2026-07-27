/**
 * Per-person taste profiles.
 *
 * A household is not one anonymous eater. Two people can want different things from the
 * same dinner, and the thing that decides whether a meal lands ("she won't touch
 * mushrooms", "he wants it spicier") only makes sense attached to a person.
 *
 * Profiles are collected in the questionnaire at /onboarding and reconciled into the
 * household-level rules the planner and validator already consume.
 */

export interface PersonProfile {
  /** Stable id so a rename does not orphan the profile. */
  id: string;
  name: string;
  /** Foods and dishes to feature. */
  loves: string[];
  /** Will eat, but do not build a meal around it. */
  dislikes: string[];
  /** Absolute refusals. Treated as hard nos. */
  neverEat: string[];
  /** Medical. Treated identically to neverEat, tracked separately so it reads clearly. */
  allergies: string[];
  /** Cuisines this person wants more of. */
  cuisines: string[];
  /** What they are going for, in their words. */
  goals: string[];
  /** The "anything else" box. */
  notes: string;
}

export interface ReconciledPreferences {
  /** Union of everyone's allergies and refusals. Never an intersection. */
  neverUse: string[];
  /** Loved by every person who answered. Feature often. */
  everyoneLoves: string[];
  /** Loved by someone, disliked by no one. Rotate in. */
  someoneLoves: string[];
  /** Loved by at least one person and disliked by at least one other. */
  contested: string[];
  /** Union of everyone's cuisines. */
  cuisines: string[];
}

export const MAX_PEOPLE = 8;

export function createPersonProfile(name = "", index = 0): PersonProfile {
  return {
    id: `person-${index + 1}`,
    name,
    loves: [],
    dislikes: [],
    neverEat: [],
    allergies: [],
    cuisines: [],
    goals: [],
    notes: "",
  };
}

/** Two adults is the shape this app was built for; the questionnaire can add more. */
export function defaultPeople(): PersonProfile[] {
  return [createPersonProfile("", 0), createPersonProfile("", 1)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const cleaned = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);

  return dedupeByComparable(cleaned);
}

/**
 * Comparison key for matching the same food written two ways ("Cilantro" vs " cilantro ").
 * Deliberately simple: casefold and collapse whitespace. It does not stem or singularize,
 * because merging "date" and "dates" wrongly would be worse than showing both.
 */
export function comparableFoodKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Dedupe case-insensitively while keeping the first spelling the user typed. */
function dedupeByComparable(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = comparableFoodKey(value);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(value.trim());
  }

  return result;
}

export function normalizePerson(value: unknown, index: number): PersonProfile {
  const raw = isRecord(value) ? value : {};
  const fallback = createPersonProfile("", index);

  return {
    id: typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : fallback.id,
    name: typeof raw.name === "string" ? raw.name.trim() : "",
    loves: normalizeStringList(raw.loves),
    dislikes: normalizeStringList(raw.dislikes),
    neverEat: normalizeStringList(raw.neverEat),
    allergies: normalizeStringList(raw.allergies),
    cuisines: normalizeStringList(raw.cuisines),
    goals: normalizeStringList(raw.goals),
    notes: typeof raw.notes === "string" ? raw.notes.trim() : "",
  };
}

/**
 * Coerce stored or submitted JSON into profiles.
 *
 * Returns an empty array for anything unrecognized rather than inventing people — an
 * empty list is the honest representation of "the questionnaire has not been filled in",
 * and reconcilePeople handles it without contributing any rules.
 */
export function normalizePeople(value: unknown): PersonProfile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(0, MAX_PEOPLE).map((person, index) => normalizePerson(person, index));
}

/** True when this person has said anything at all beyond a name. */
export function personHasAnswers(person: PersonProfile): boolean {
  return (
    person.loves.length > 0 ||
    person.dislikes.length > 0 ||
    person.neverEat.length > 0 ||
    person.allergies.length > 0 ||
    person.cuisines.length > 0 ||
    person.goals.length > 0 ||
    person.notes.trim().length > 0
  );
}

export function personDisplayName(person: PersonProfile, index: number): string {
  return person.name.trim() || `Person ${index + 1}`;
}

/**
 * Merge everyone's answers into household-level rules.
 *
 * The one rule that matters: **hard nos are a union, never an intersection.** If either
 * person cannot eat shellfish, the household cannot, no matter how much the other loves
 * it — so a hard no also removes that item from every "loves" bucket.
 *
 * People who answered nothing are ignored entirely, so a half-filled questionnaire does
 * not make everything "contested" against an empty profile.
 */
export function reconcilePeople(people: PersonProfile[]): ReconciledPreferences {
  const answering = people.filter(personHasAnswers);

  if (answering.length === 0) {
    return {
      neverUse: [],
      everyoneLoves: [],
      someoneLoves: [],
      contested: [],
      cuisines: [],
    };
  }

  const neverUse = dedupeByComparable(
    answering.flatMap((person) => [...person.allergies, ...person.neverEat])
  );
  const neverUseKeys = new Set(neverUse.map(comparableFoodKey));

  // Index loves and dislikes by comparable key, keeping the first spelling seen.
  const lovedBy = new Map<string, { label: string; people: Set<string> }>();
  const dislikedBy = new Map<string, { label: string; people: Set<string> }>();

  for (const person of answering) {
    for (const [list, index] of [
      [person.loves, lovedBy],
      [person.dislikes, dislikedBy],
    ] as const) {
      for (const item of list) {
        const key = comparableFoodKey(item);
        if (!key || neverUseKeys.has(key)) {
          // A hard no anywhere in the household beats anyone's preference.
          continue;
        }

        const existing = index.get(key);
        if (existing) {
          existing.people.add(person.id);
        } else {
          index.set(key, { label: item, people: new Set([person.id]) });
        }
      }
    }
  }

  const everyoneLoves: string[] = [];
  const someoneLoves: string[] = [];
  const contested: string[] = [];

  for (const [key, loved] of lovedBy) {
    const disliked = dislikedBy.get(key);

    if (disliked && disliked.people.size > 0) {
      contested.push(loved.label);
    } else if (loved.people.size === answering.length) {
      everyoneLoves.push(loved.label);
    } else {
      someoneLoves.push(loved.label);
    }
  }

  return {
    neverUse,
    everyoneLoves,
    someoneLoves,
    contested,
    cuisines: dedupeByComparable(answering.flatMap((person) => person.cuisines)),
  };
}

/** Everyone's goals, in their own words, deduplicated. */
export function collectGoals(people: PersonProfile[]): string[] {
  return dedupeByComparable(people.flatMap((person) => person.goals));
}

/**
 * Union two lists without dropping anything already present.
 *
 * Used to fold reconciled hard nos into the settings-level avoid list: the questionnaire
 * only ever adds, so a numbers screen can never silently delete someone's allergy.
 */
export function unionFoodLists(base: string[], additions: string[]): string[] {
  return dedupeByComparable([...base, ...additions]);
}
