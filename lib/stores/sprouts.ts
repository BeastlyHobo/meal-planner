import { buildExactOverrides, StoreDefinition } from "@/lib/stores/types";

/**
 * Sprouts — the weekly store.
 *
 * Sprouts is produce-first: you walk into the produce island, loop the perimeter for
 * deli/meat/dairy, then come back through the center aisles. Reorder SPROUTS_ZONES to
 * match your own store and the Shop screen follows it immediately.
 *
 * Documented in data/shopping-areas.md.
 */
export const SPROUTS_ZONES = [
  "Produce — Vegetables",
  "Produce — Fruit",
  "Fresh Herbs",
  "Bulk Bins",
  "Bakery & Bread",
  "Deli & Prepared",
  "Cheese",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Frozen",
  "Grocery — Pantry",
  "Grocery — Snacks",
  "Grocery — Sweets",
  "Beverages",
  "Beer & Wine",
  "Vitamins & Body Care",
  "Household",
] as const;

export type SproutsZone = (typeof SPROUTS_ZONES)[number];

export const sproutsStore: StoreDefinition = {
  key: "sprouts",
  name: "Sprouts",
  cadence: "weekly",
  cadenceLabel: "About twice a week",
  blurb: "Fresh and perishable — produce, deli, dairy, bread, and the week's dinners.",
  zones: SPROUTS_ZONES,
  defaultZone: "Grocery — Pantry",

  // Items whose name would otherwise be classified into the wrong aisle.
  exactOverrides: buildExactOverrides([
    ["Grocery — Sweets", ["Flax seed brownies", "Flaxseed brownies", "Flax brownies"]],
    ["Bulk Bins", ["Bulk rolled oats", "Bulk raw almonds", "Bulk walnuts", "Bulk quinoa"]],
    ["Produce — Vegetables", ["Roma tomatoes", "Cherry tomatoes", "Grape tomatoes"]],
    ["Produce — Fruit", ["Lemons", "Limes", "Avocados", "Avocado"]],
    ["Deli & Prepared", ["Rotisserie chicken", "Hummus", "Guacamole", "Tzatziki"]],
    ["Grocery — Pantry", ["Coconut milk", "Tahini", "Fish sauce", "Rice vinegar"]],
  ]),

  // First match wins — specific rules come before general ones.
  keywordRules: [
    {
      zone: "Frozen",
      terms: [
        "frozen", "ice cream", "gelato", "sorbet", "frozen berries", "frozen mango",
        "edamame", "frozen peas", "frozen corn", "cauliflower gnocchi", "frozen waffle",
        "frozen pizza", "popsicle", "frozen shrimp", "frozen fish",
      ],
    },
    {
      zone: "Fresh Herbs",
      terms: [
        "fresh herbs", "cilantro", "parsley", "basil", "mint", "fresh dill", "chives",
        "fresh thyme", "rosemary", "fresh oregano", "fresh sage", "tarragon", "lemongrass",
      ],
    },
    {
      zone: "Bulk Bins",
      terms: ["bulk ", "bulk bin", "trail mix", "dried apricot", "dried cranberr", "date pieces"],
    },
    {
      zone: "Beer & Wine",
      terms: [
        "beer", "wine", " ipa", "pilsner", "stout", "porter", " ale", "hard cider",
        "cabernet", "pinot", "sauvignon", "chardonnay", "merlot", "syrah", "malbec",
        "prosecco", "rose wine", "seltzer hard",
      ],
      excludeTerms: ["vinegar", "root beer", "ginger beer", "non alcoholic"],
    },
    {
      zone: "Cheese",
      terms: [
        "cheese", "feta", "ricotta", "mozzarella", "cheddar", "parmesan", "gouda",
        "manchego", "brie", "halloumi", "queso fresco", "cotija", "provolone",
        "swiss", "havarti", "asiago", "pecorino", "gruyere", "monterey jack",
        "pepper jack", "burrata",
      ],
      excludeTerms: ["cream cheese", "cottage cheese", "cheese puffs", "cheese crackers", "mac and cheese"],
    },
    {
      zone: "Deli & Prepared",
      terms: [
        "deli turkey", "sliced turkey", "turkey breast", "oven roasted turkey", "deli meat",
        "sliced ham", "roast beef", "prosciutto", "salami", "pepperoni", "smoked salmon",
        "lox", "rotisserie", "hummus", "guacamole", "tzatziki", "olive bar", "prepared salad",
        "salad kit", "chopped salad",
      ],
    },
    {
      zone: "Meat & Seafood",
      terms: [
        "chicken thigh", "chicken breast", "chicken tender", "whole chicken", "ground turkey",
        "ground beef", "ground chicken", "ground pork", "steak", "sirloin", "pork chop",
        "pork tenderloin", "bacon", "italian sausage", "chicken sausage", "salmon fillet",
        "fresh salmon", "cod", "halibut", "tilapia", "shrimp", "scallop", "ahi", "lamb",
      ],
    },
    {
      zone: "Dairy & Eggs",
      terms: [
        "egg", "greek yogurt", "yogurt", "cottage cheese", "cream cheese", "sour cream",
        "milk", "kefir", "butter", "half and half", "heavy cream", "creamer", "oat milk",
        "almond milk",
      ],
      excludeTerms: ["butternut", "nut butter", "peanut butter", "almond butter", "cashew butter", "eggplant"],
    },
    {
      zone: "Bakery & Bread",
      terms: [
        "bread", "sourdough", "tortilla", "pita", "naan", "lavash", "bagel",
        "english muffin", "baguette", "ciabatta", "brioche", "bun", "roll", "wrap",
      ],
      // The chip aisle borrows bakery words; keep those out of the bread section.
      excludeTerms: [
        "breadcrumb", "bread crumb", "tortilla chip", "pita chip", "bagel chip",
        "naan chip", "crouton",
      ],
    },
    {
      zone: "Grocery — Snacks",
      terms: [
        "chips", "tortilla chip", "pita chip", "potato chip", "plantain chip", "popcorn",
        "pretzel", "cracker", "rice cake", "seaweed snack", "veggie straw",
      ],
    },
    {
      zone: "Grocery — Sweets",
      terms: [
        "brownie", "cookie", "chocolate", "candy", "cake", "cupcake", "muffin", "pastry",
        "caramel", "licorice", "gummy", "gummies", "toffee", "biscotti", "dessert",
      ],
    },
    {
      zone: "Beverages",
      terms: [
        "sparkling water", "seltzer", "kombucha", "juice", "lemonade", "soda", "cold brew",
        "iced tea", "green tea", "herbal tea", "tea bag", "chai", "yerba mate", "coffee",
        "espresso",
      ],
    },
    {
      zone: "Vitamins & Body Care",
      terms: [
        "vitamin", "supplement", "probiotic", "collagen", "magnesium", "sunscreen",
        "shampoo", "conditioner", "body wash", "deodorant", "toothpaste", "lotion",
      ],
    },
    {
      zone: "Household",
      terms: [
        "paper towel", "toilet paper", "bath tissue", "tissue", "trash bag", "dish soap",
        "dishwasher", "laundry detergent", "sponge", "cleaner", "foil", "parchment",
        "zip top", "ziploc", "storage bag",
      ],
    },
    {
      zone: "Produce — Fruit",
      terms: [
        "banana", "apple", "berry", "berries", "blueberr", "strawberr", "raspberr",
        "blackberr", "mango", "lemon", "lime", "avocado", "orange", "clementine", "grape",
        "pear", "kiwi", "peach", "plum", "melon", "pineapple", "pomegranate", "fig",
      ],
      // "pearl couscous" is not a pear; "grapeseed oil" is not a grape.
      excludeTerms: [
        "grape tomato", "grapeseed", "juice", "dried", "pearl", "orange chicken",
        "lime bean", "limeade",
      ],
    },
    {
      zone: "Produce — Vegetables",
      terms: [
        "spinach", "lettuce", "romaine", "arugula", "spring mix", "mixed greens", "kale",
        "cabbage", "slaw", "cucumber", "tomato", "zucchini", "squash", "bell pepper",
        "pepper", "broccoli", "cauliflower", "asparagus", "green bean", "brussels",
        "mushroom", "carrot", "celery", "corn", "snap pea", "snow pea", "eggplant",
        "radish", "bok choy", "leek", "scallion", "green onion", "sweet potato", "potato",
        "onion", "shallot", "garlic", "ginger", "beet", "jalapeno", "serrano", "poblano",
      ],
      excludeTerms: ["pepper corn", "black pepper", "red pepper flake", "peppercorn", "garlic powder", "onion powder"],
    },
    {
      zone: "Grocery — Pantry",
      terms: [
        "sauce", "salsa", "curry", "paste", "marinara", "pesto", "mustard", "mayo",
        "ketchup", "vinegar", "oil", "soy sauce", "tamari", "sriracha", "harissa",
        "gochujang", "chipotle", "adobo", "miso", "sambal", "hoisin", "mirin",
        "fish sauce", "coconut aminos", "zaatar", "za atar", "dukkah", "furikake",
        "chutney", "dressing", "broth", "stock", "coconut milk", "canned", "jarred",
        "beans", "chickpea", "lentil", "rice", "quinoa", "farro", "couscous", "pasta",
        "orzo", "noodle", "oats", "oatmeal", "granola", "cereal", "flour", "sugar",
        "honey", "maple syrup", "seasoning", "spice", "salt", "peppercorn", "cumin",
        "paprika", "cinnamon", "nut butter", "peanut butter", "almond butter", "tahini",
        "seeds", "nuts", "almond", "cashew", "walnut", "pepita", "chia", "flax", "hemp",
        "tofu", "tempeh", "protein powder", "bar", "olive", "pickle", "tomato paste",
      ],
    },
  ],
};
