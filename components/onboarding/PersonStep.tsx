"use client";

import { ListField, TextAreaField, TextField } from "@/components/settings/Fields";
import { personDisplayName, type PersonProfile } from "@/lib/settings";
import { cardClass } from "@/lib/uiClasses";

/**
 * One person's answers.
 *
 * Everything is free text so nobody is limited to a vocabulary this app picked. The
 * split between "dislikes" and "never eat" is the one distinction worth insisting on:
 * dislikes shape what gets featured, never-eat is a hard constraint that overrides the
 * other person's preferences.
 */
export default function PersonStep({
  person,
  index,
  onChange,
}: {
  person: PersonProfile;
  index: number;
  onChange: (next: PersonProfile) => void;
}) {
  function update<K extends keyof PersonProfile>(key: K, value: PersonProfile[K]) {
    onChange({ ...person, [key]: value });
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="font-serif text-2xl font-semibold leading-tight text-[var(--foreground)]">
          {personDisplayName(person, index)}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          Answer for yourself, not for the household. The two sets get merged on the last
          step — you&apos;ll see exactly how.
        </p>
      </header>

      <section className={`space-y-4 p-4 ${cardClass}`}>
        <TextField
          label="Name"
          value={person.name}
          placeholder="First name"
          onChange={(value) => update("name", value)}
        />

        <ListField
          label="Foods you love"
          hint="Separate with commas. These get featured."
          value={person.loves}
          placeholder="Salmon, mushrooms, anything spicy, crispy potatoes"
          onChange={(value) => update("loves", value)}
        />

        <ListField
          label="Foods you'd rather not"
          hint="You'll eat them, you just don't want them to be the point of dinner."
          value={person.dislikes}
          placeholder="Olives, tofu, very sweet sauces"
          onChange={(value) => update("dislikes", value)}
        />
      </section>

      <section className={`space-y-4 p-4 ${cardClass}`}>
        <h3 className="text-[10px] font-black uppercase tracking-[0.18em] text-harvest-terracotta">
          Hard nos
        </h3>
        <p className="-mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
          These win over everything, including the other person&apos;s favorites. Nothing
          here will ever be planned.
        </p>

        <ListField
          label="Allergies and intolerances"
          hint="Medical. Kept separate so it reads clearly in the plan."
          value={person.allergies}
          placeholder="Shellfish, tree nuts"
          onChange={(value) => update("allergies", value)}
        />

        <ListField
          label="Will not eat"
          hint="Not medical, just never."
          value={person.neverEat}
          placeholder="Cilantro, liver, blue cheese"
          onChange={(value) => update("neverEat", value)}
        />
      </section>

      <section className={`space-y-4 p-4 ${cardClass}`}>
        <ListField
          label="Cuisines you want more of"
          hint="Separate with commas."
          value={person.cuisines}
          placeholder="Thai, Mediterranean, Mexican"
          onChange={(value) => update("cuisines", value)}
        />

        <ListField
          label="What you're going for"
          hint="In your words. Separate with commas."
          value={person.goals}
          placeholder="More protein, eat out less, less bloated after dinner"
          onChange={(value) => update("goals", value)}
        />

        <TextAreaField
          label="Anything else"
          hint="The things the boxes above can't hold."
          value={person.notes}
          rows={5}
          placeholder="I'll eat salmon but no other fish. Leftovers are fine except seafood. Medium heat is my ceiling."
          onChange={(value) => update("notes", value)}
        />
      </section>
    </div>
  );
}
