import { buildExactOverrides, StoreDefinition } from "@/lib/stores/types";

/**
 * Costco — the monthly bulk run.
 *
 * Warehouse order puts dry pallets and household goods first and the refrigerated
 * perimeter last, so cold items spend the least time in the cart. Reorder
 * COSTCO_ZONES to match your warehouse.
 *
 * Documented in data/shopping-areas.md.
 */
export const COSTCO_ZONES = [
  "Bakery",
  "Dry Goods & Pantry",
  "Snacks & Sweets",
  "Beverages",
  "Paper & Household",
  "Cleaning & Laundry",
  "Health & Personal Care",
  "Deli & Prepared",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Produce",
  "Frozen",
] as const;

export type CostcoZone = (typeof COSTCO_ZONES)[number];

export const costcoStore: StoreDefinition = {
  key: "costco",
  name: "Costco",
  cadence: "monthly",
  cadenceLabel: "About once a month",
  blurb: "Bulk and freezer stock — meat, paper goods, and anything that keeps.",
  zones: COSTCO_ZONES,
  defaultZone: "Dry Goods & Pantry",

  exactOverrides: buildExactOverrides([
    ["Paper & Household", ["Toilet paper", "Paper towels", "Bath tissue", "Trash bags", "Aluminum foil", "Parchment paper", "Storage bags"]],
    ["Cleaning & Laundry", ["Laundry detergent", "Dishwasher pods", "Dish soap", "Disinfecting wipes"]],
    ["Meat & Seafood", ["Chicken thighs", "Chicken breasts", "Ground beef", "Ground turkey", "Salmon fillets", "Raw shrimp"]],
    ["Frozen", ["Frozen shrimp", "Frozen salmon", "Frozen berries", "Frozen broccoli", "Frozen green beans"]],
    ["Dry Goods & Pantry", ["Olive oil", "Jasmine rice", "Basmati rice", "Quinoa", "Rolled oats", "Canned tomatoes", "Chicken broth"]],
  ]),

  keywordRules: [
    {
      zone: "Frozen",
      terms: [
        "frozen", "ice cream", "frozen berries", "frozen vegetable", "frozen broccoli",
        "frozen green bean", "frozen corn", "frozen shrimp", "frozen salmon", "edamame",
      ],
    },
    {
      zone: "Cleaning & Laundry",
      terms: [
        "laundry detergent", "detergent", "dishwasher", "dish soap", "cleaner", "bleach",
        "disinfect", "wipes", "sponge", "fabric softener",
      ],
    },
    {
      zone: "Paper & Household",
      terms: [
        "paper towel", "toilet paper", "bath tissue", "tissue", "napkin", "trash bag",
        "garbage bag", "aluminum foil", "foil", "parchment", "plastic wrap", "storage bag",
        "ziploc", "zip top", "batteries", "light bulb",
      ],
    },
    {
      zone: "Health & Personal Care",
      terms: [
        "vitamin", "supplement", "ibuprofen", "acetaminophen", "toothpaste", "toothbrush",
        "shampoo", "conditioner", "body wash", "deodorant", "razor", "sunscreen", "lotion",
        "contact solution", "band aid",
      ],
    },
    {
      zone: "Meat & Seafood",
      terms: [
        "chicken thigh", "chicken breast", "whole chicken", "ground beef", "ground turkey",
        "ground chicken", "ground pork", "steak", "sirloin", "ribeye", "brisket", "pork chop",
        "pork tenderloin", "pork loin", "bacon", "sausage", "salmon", "cod", "halibut",
        "tilapia", "shrimp", "scallop", "ahi", "lamb", "carne asada", "meat",
      ],
    },
    {
      zone: "Deli & Prepared",
      terms: [
        "rotisserie", "deli meat", "sliced turkey", "deli turkey", "hummus", "guacamole",
        "street taco kit", "prepared", "prosciutto", "salami",
      ],
    },
    {
      zone: "Dairy & Eggs",
      terms: [
        "egg", "milk", "greek yogurt", "yogurt", "butter", "cream cheese", "sour cream",
        "cottage cheese", "heavy cream", "half and half", "shredded cheese", "cheese",
        "creamer",
      ],
      excludeTerms: ["nut butter", "peanut butter", "almond butter", "eggplant", "cheese crackers", "cheese puffs"],
    },
    {
      zone: "Produce",
      terms: [
        "spinach", "spring mix", "lettuce", "romaine", "kale", "carrot", "celery", "onion",
        "potato", "sweet potato", "tomato", "avocado", "berry", "berries", "blueberr",
        "strawberr", "banana", "apple", "orange", "clementine", "grape", "mushroom",
        "bell pepper", "broccoli", "cucumber", "garlic", "lemon", "lime",
      ],
      excludeTerms: ["juice", "dried", "frozen", "garlic powder", "onion powder"],
    },
    {
      zone: "Bakery",
      terms: ["bread", "bagel", "croissant", "muffin", "tortilla", "naan", "pita", "roll", "baguette"],
      excludeTerms: ["breadcrumb", "bread crumb"],
    },
    {
      zone: "Snacks & Sweets",
      terms: [
        "chips", "cracker", "pretzel", "popcorn", "trail mix", "granola bar", "protein bar",
        "candy", "chocolate", "cookie", "brownie", "fruit snack", "nuts", "almond", "cashew",
        "pistachio", "walnut", "pecan",
      ],
    },
    {
      zone: "Beverages",
      terms: [
        "sparkling water", "seltzer", "juice", "soda", "kombucha", "coffee", "espresso",
        "tea", "energy drink", "water bottle", "gatorade", "electrolyte",
      ],
    },
    {
      zone: "Dry Goods & Pantry",
      terms: [
        "olive oil", "avocado oil", "canola oil", "coconut oil", "oil", "vinegar", "rice",
        "quinoa", "pasta", "noodle", "oats", "oatmeal", "flour", "sugar", "honey",
        "maple syrup", "canned", "broth", "stock", "beans", "chickpea", "lentil", "salsa",
        "marinara", "sauce", "soy sauce", "peanut butter", "nut butter", "seasoning",
        "spice", "salt", "pepper", "protein powder", "cereal", "granola", "tuna",
        "coconut milk", "tomato paste",
      ],
    },
  ],
};
