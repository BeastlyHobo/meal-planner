# Current Week Plan: July 27 — August 2

Four dinners with full recipes. Breakfast and lunch are not planned here — they come off
the recurring staples list, which is where the turkey, cheese, lettuce, and bread live.

Proteins come out of the freezer from the last Costco run; produce, dairy, bread, and
sauces come from Sprouts. The shopping list is derived from these ingredients and split
between the two stores automatically — do not hand-author `shoppingList`.

Cuisines this week: North African, Korean, American sheet pan, Mexican.
Proteins: chicken thighs, ground beef, salmon, shrimp.

## Canonical JSON
```json
{
  "weekRange": "July 27 — August 2",
  "meals": [
    {
      "type": "Dinner",
      "name": "Harissa Chicken with Lemony Pearl Couscous",
      "build": {
        "pro": ["Boneless skinless chicken thighs", "Chickpeas", "Feta cheese"],
        "base": ["Pearl couscous"],
        "veg": ["Zucchini", "Red bell pepper"],
        "engine": ["Harissa paste"]
      },
      "ingredients": [
        { "name": "Boneless skinless chicken thighs", "quantity": "6 oz per person", "category": "pro", "store": "costco", "macros": { "cal": 250, "p": 32, "c": 0, "f": 13, "fiber": 0 } },
        { "name": "Chickpeas", "quantity": "1/2 cup", "category": "pro", "macros": { "cal": 130, "p": 7, "c": 22, "f": 2, "fiber": 6 } },
        { "name": "Feta cheese", "quantity": "1 oz crumbled", "category": "pro", "macros": { "cal": 75, "p": 4, "c": 1, "f": 6, "fiber": 0 } },
        { "name": "Pearl couscous", "quantity": "1/2 cup cooked", "category": "base", "macros": { "cal": 160, "p": 6, "c": 33, "f": 1, "fiber": 2 } },
        { "name": "Zucchini", "quantity": "1 cup half-moons", "category": "veg", "macros": { "cal": 20, "p": 2, "c": 4, "f": 0, "fiber": 1 } },
        { "name": "Red bell pepper", "quantity": "3/4 cup sliced", "category": "veg", "macros": { "cal": 25, "p": 1, "c": 6, "f": 0, "fiber": 2 } },
        { "name": "Harissa paste", "quantity": "1 tbsp", "category": "engine", "macros": { "cal": 30, "p": 1, "c": 3, "f": 2, "fiber": 1 } }
      ],
      "recipe": {
        "servings": 4,
        "prepMinutes": 10,
        "cookMinutes": 25,
        "equipment": ["Large skillet", "Medium saucepan"],
        "steps": [
          "Pat the chicken thighs dry and season both sides with salt and pepper. Toss with the harissa paste and let sit while you prep the vegetables.",
          "Bring salted water to a boil in the saucepan. Add the pearl couscous and simmer 8 to 10 minutes until tender but still chewy. Drain and return to the pot.",
          "Heat a film of oil in the skillet over medium-high. Sear the chicken 5 to 6 minutes per side until deeply browned and cooked through. Move to a plate to rest.",
          "Add the zucchini and bell pepper to the same skillet. Cook 5 minutes without stirring much so they char, then stir in the drained chickpeas and warm through.",
          "Fold the vegetables and chickpeas into the couscous with a squeeze of lemon. Slice the chicken, lay it on top, and scatter the feta over everything."
        ],
        "notes": "Doubling the harissa on the chicken makes it noticeably spicier, not just more flavorful. Keeps 4 days; the couscous soaks up the dressing overnight, so add a splash of water when reheating."
      },
      "macros": { "cal": 690, "p": 53, "c": 69, "f": 24, "fiber": 12 }
    },
    {
      "type": "Dinner",
      "name": "Gochujang Beef and Broccoli Rice Bowls",
      "build": {
        "pro": ["Ground beef", "Shelled edamame"],
        "base": ["Jasmine rice"],
        "veg": ["Broccoli florets", "Scallions"],
        "engine": ["Gochujang"]
      },
      "ingredients": [
        { "name": "Ground beef", "quantity": "5 oz per person", "category": "pro", "store": "costco", "macros": { "cal": 250, "p": 30, "c": 0, "f": 14, "fiber": 0 } },
        { "name": "Shelled edamame", "quantity": "1/2 cup", "category": "pro", "macros": { "cal": 90, "p": 8, "c": 7, "f": 4, "fiber": 4 } },
        { "name": "Jasmine rice", "quantity": "3/4 cup cooked", "category": "base", "store": "costco", "macros": { "cal": 160, "p": 3, "c": 35, "f": 0, "fiber": 1 } },
        { "name": "Broccoli florets", "quantity": "1 1/2 cups", "category": "veg", "macros": { "cal": 45, "p": 4, "c": 9, "f": 0, "fiber": 4 } },
        { "name": "Scallions", "quantity": "2 tbsp sliced", "category": "veg", "macros": { "cal": 5, "p": 0, "c": 1, "f": 0, "fiber": 0 } },
        { "name": "Gochujang", "quantity": "1 tbsp", "category": "engine", "macros": { "cal": 35, "p": 1, "c": 7, "f": 0, "fiber": 0 } },
        { "name": "Toasted sesame oil", "quantity": "1 tsp", "category": "engine", "macros": { "cal": 40, "p": 0, "c": 0, "f": 5, "fiber": 0 } }
      ],
      "recipe": {
        "servings": 4,
        "prepMinutes": 10,
        "cookMinutes": 20,
        "equipment": ["Rice cooker or saucepan", "Large skillet"],
        "steps": [
          "Start the jasmine rice. While it cooks, whisk the gochujang with the sesame oil and 2 tablespoons of water into a pourable sauce.",
          "Brown the ground beef in a dry skillet over medium-high heat, breaking it up as it goes. Do not stir constantly — let it sit long enough to crust.",
          "Pour off most of the fat, then add the broccoli and edamame with a splash of water. Cover and steam 4 minutes until the broccoli is bright green and just tender.",
          "Uncover, add the gochujang sauce, and toss until everything is glossy and the liquid has tightened, about 2 minutes.",
          "Spoon over the rice and finish with the sliced scallions."
        ],
        "notes": "Frozen broccoli works here with no change in timing. If the sauce breaks or looks thin, another 30 seconds over high heat brings it back together."
      },
      "macros": { "cal": 625, "p": 46, "c": 59, "f": 23, "fiber": 9 }
    },
    {
      "type": "Dinner",
      "name": "Sheet Pan Salmon with Blistered Green Beans",
      "build": {
        "pro": ["Salmon fillets"],
        "base": ["Baby potatoes"],
        "veg": ["Green beans", "Fresh dill"],
        "engine": ["Whole grain mustard"]
      },
      "ingredients": [
        { "name": "Salmon fillets", "quantity": "6 oz per person", "category": "pro", "store": "costco", "macros": { "cal": 320, "p": 34, "c": 0, "f": 20, "fiber": 0 } },
        { "name": "Baby potatoes", "quantity": "6 oz halved", "category": "base", "macros": { "cal": 140, "p": 4, "c": 31, "f": 0, "fiber": 4 } },
        { "name": "Green beans", "quantity": "1 1/2 cups trimmed", "category": "veg", "macros": { "cal": 45, "p": 2, "c": 10, "f": 0, "fiber": 4 } },
        { "name": "Fresh dill", "quantity": "1 tbsp chopped", "category": "veg", "macros": { "cal": 2, "p": 0, "c": 0, "f": 0, "fiber": 0 } },
        { "name": "Whole grain mustard", "quantity": "1 tbsp", "category": "engine", "macros": { "cal": 15, "p": 1, "c": 1, "f": 1, "fiber": 1 } },
        { "name": "Lemons", "quantity": "1/2 lemon", "category": "veg", "macros": { "cal": 10, "p": 0, "c": 3, "f": 0, "fiber": 1 } }
      ],
      "recipe": {
        "servings": 4,
        "prepMinutes": 10,
        "cookMinutes": 30,
        "equipment": ["Sheet pan"],
        "steps": [
          "Heat the oven to 425F. Toss the halved baby potatoes with oil and salt, spread them cut side down on the sheet pan, and roast 18 minutes.",
          "While the potatoes roast, stir the mustard together with the chopped dill, the juice of half a lemon, and a spoonful of oil.",
          "Push the potatoes to one side of the pan. Add the green beans in a single layer and nestle the salmon fillets in the middle. Spoon half the mustard dill mixture over the fish.",
          "Roast another 10 to 12 minutes, until the salmon flakes at the thickest point and the green beans are blistered in spots.",
          "Spoon the remaining mustard dill sauce over everything at the table."
        ],
        "notes": "Salmon straight from the freezer works if you thaw it overnight in the fridge; a still-icy fillet steams instead of roasting. Leftover salmon is better cold than reheated."
      },
      "macros": { "cal": 532, "p": 41, "c": 45, "f": 21, "fiber": 10 }
    },
    {
      "type": "Dinner",
      "name": "Chipotle Shrimp Tacos with Charred Cabbage",
      "build": {
        "pro": ["Frozen raw shrimp", "Cotija cheese"],
        "base": ["Corn tortillas"],
        "veg": ["Red cabbage", "Poblano peppers", "Cilantro"],
        "engine": ["Chipotles in adobo"]
      },
      "ingredients": [
        { "name": "Frozen raw shrimp", "quantity": "6 oz per person", "category": "pro", "store": "costco", "macros": { "cal": 170, "p": 36, "c": 1, "f": 2, "fiber": 0 } },
        { "name": "Cotija cheese", "quantity": "3/4 oz crumbled", "category": "pro", "macros": { "cal": 70, "p": 5, "c": 1, "f": 6, "fiber": 0 } },
        { "name": "Corn tortillas", "quantity": "3 tortillas", "category": "base", "macros": { "cal": 180, "p": 5, "c": 36, "f": 3, "fiber": 5 } },
        { "name": "Red cabbage", "quantity": "1 1/2 cups shredded", "category": "veg", "macros": { "cal": 35, "p": 2, "c": 8, "f": 0, "fiber": 3 } },
        { "name": "Poblano peppers", "quantity": "1 pepper, sliced", "category": "veg", "macros": { "cal": 20, "p": 1, "c": 4, "f": 0, "fiber": 2 } },
        { "name": "Cilantro", "quantity": "2 tbsp chopped", "category": "veg", "macros": { "cal": 2, "p": 0, "c": 0, "f": 0, "fiber": 0 } },
        { "name": "Chipotles in adobo", "quantity": "1 tbsp minced", "category": "engine", "macros": { "cal": 20, "p": 0, "c": 4, "f": 0, "fiber": 1 } },
        { "name": "Limes", "quantity": "1/2 lime", "category": "veg", "macros": { "cal": 10, "p": 0, "c": 3, "f": 0, "fiber": 1 } }
      ],
      "recipe": {
        "servings": 4,
        "prepMinutes": 15,
        "cookMinutes": 15,
        "equipment": ["Large skillet"],
        "steps": [
          "Thaw the shrimp under cold running water, then dry them well — wet shrimp will not brown. Toss with the minced chipotles in adobo.",
          "Get the skillet very hot. Add the cabbage and poblano in a single layer and leave them alone for 3 minutes so the edges char, then stir once and cook 2 minutes more. Move to a bowl and squeeze half a lime over the top.",
          "Return the skillet to high heat with a little oil. Cook the shrimp 90 seconds per side, until just opaque and curled into a loose C. A tight O means they are overcooked.",
          "Warm the corn tortillas directly over a burner or in the dry skillet, about 20 seconds per side.",
          "Build the tacos with the charred cabbage first, then the shrimp, then the cotija and cilantro."
        ],
        "notes": "The charred cabbage is the point — do not stir it early. Prep it up to a day ahead and the tacos come together in under 10 minutes."
      },
      "macros": { "cal": 507, "p": 49, "c": 57, "f": 11, "fiber": 12 }
    }
  ],
  "staples": [
    { "category": "Sandwich Turkey", "n": "Sliced oven-roasted turkey breast", "store": "sprouts", "q": "1 lb" },
    { "category": "Sandwich Cheese", "n": "Sliced provolone or cheddar", "store": "sprouts", "q": "1/2 lb" },
    { "category": "Sandwich Bread", "n": "Sourdough or whole grain sandwich bread", "store": "sprouts", "q": "1 loaf" },
    { "category": "Lettuce", "n": "Green leaf lettuce", "store": "sprouts", "q": "1 head" },
    { "category": "Salad Greens", "n": "Spring mix", "store": "sprouts", "q": "1 box" },
    { "category": "Tomatoes", "n": "Roma tomatoes", "store": "sprouts", "q": "4" },
    { "category": "Avocados", "n": "Avocados", "store": "sprouts", "q": "3" },
    { "category": "Bananas", "n": "Bananas", "store": "sprouts", "q": "1 bunch" },
    { "category": "Berries", "n": "Blueberries", "store": "sprouts", "q": "1 pint" },
    { "category": "Greek Yogurt", "n": "Plain Greek yogurt", "store": "sprouts", "q": "32 oz" },
    { "category": "Hummus", "n": "Hummus", "store": "sprouts", "q": "1 tub" },
    { "category": "Flax Brownies", "n": "Flax seed brownies", "store": "sprouts", "q": "1 package" },
    { "category": "Toilet Paper", "n": "Toilet paper", "store": "costco", "q": "1 pack" },
    { "category": "Paper Towels", "n": "Paper towels", "store": "costco", "q": "1 pack" },
    { "category": "Trash Bags", "n": "Kitchen trash bags", "store": "costco", "q": "1 box" },
    { "category": "Laundry Detergent", "n": "Laundry detergent", "store": "costco", "q": "1 jug" },
    { "category": "Dishwasher Pods", "n": "Dishwasher pods", "store": "costco", "q": "1 tub" },
    { "category": "Eggs", "n": "Eggs", "store": "costco", "q": "24 count" },
    { "category": "Chicken Thighs", "n": "Boneless skinless chicken thighs", "store": "costco", "q": "6 lb, portion and freeze" },
    { "category": "Ground Beef", "n": "Ground beef", "store": "costco", "q": "4 lb, portion and freeze" },
    { "category": "Salmon", "n": "Salmon fillets", "store": "costco", "q": "3 lb, portion and freeze" },
    { "category": "Shrimp", "n": "Frozen raw shrimp", "store": "costco", "q": "2 lb bag" },
    { "category": "Olive Oil", "n": "Olive oil", "store": "costco", "q": "1 bottle" },
    { "category": "Rice", "n": "Jasmine rice", "store": "costco", "q": "1 bag" },
    { "category": "Coffee", "n": "Whole bean coffee", "store": "costco", "q": "1 bag" }
  ],
  "junkList": [
    {
      "category": "Coffee/Creamer",
      "items": [
        { "n": "Oat milk creamer", "q": "1 carton" }
      ]
    },
    {
      "category": "Beer/Wine",
      "items": [
        { "n": "Local IPA six-pack", "q": "1 six-pack" },
        { "n": "Pinot noir", "q": "1 bottle" }
      ]
    },
    {
      "category": "Chips",
      "items": [
        { "n": "Tortilla chips", "q": "1 bag" }
      ]
    },
    {
      "category": "Sweets",
      "items": [
        { "n": "Dark chocolate almonds", "q": "1 bag" }
      ]
    },
    {
      "category": "Frozen Food",
      "items": [
        { "n": "Frozen cheese pizza", "q": "1" }
      ]
    },
    {
      "category": "Frozen Treats",
      "items": [
        { "n": "Mint chip ice cream", "q": "1 pint" }
      ]
    },
    {
      "category": "Beverages/Drinks",
      "items": [
        { "n": "Grapefruit sparkling water", "q": "1 twelve-pack" }
      ]
    }
  ]
}
```
