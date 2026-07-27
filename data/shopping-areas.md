# Store Layouts & Shopping Flow

Harvest plans around two stores with different rhythms:

| Store | Cadence | What it covers |
|---|---|---|
| **Sprouts** | ~2x/week | Fresh and perishable: produce, deli, cheese, dairy, bread, sauces |
| **Costco** | ~1x/month | Bulk and freezer stock: raw meat, paper goods, cleaning, large-format pantry |

Shopping lists are **derived**, not hand-authored. Every meal ingredient, junk item, and
staple is routed to a store and then to an aisle within that store's walking order.

**These layouts are meant to be edited.** They describe one household's stores. Reorder
the zones in `lib/stores/sprouts.ts` and `lib/stores/costco.ts` to match yours and the
Shop screen follows immediately.

---

## Sprouts walk order

Produce-first: in through the produce island, around the perimeter for deli/meat/dairy,
back through the center aisles, then the front-of-store extras.

```
 1. Produce — Vegetables
 2. Produce — Fruit
 3. Fresh Herbs
 4. Bulk Bins
 5. Bakery & Bread
 6. Deli & Prepared
 7. Cheese
 8. Meat & Seafood
 9. Dairy & Eggs
10. Frozen
11. Grocery — Pantry
12. Grocery — Snacks
13. Grocery — Sweets
14. Beverages
15. Beer & Wine
16. Vitamins & Body Care
17. Household
```

| Zone | What lands here |
|---|---|
| **Produce — Vegetables** | Greens, lettuce, cabbage, peppers, squash, roots, alliums, mushrooms |
| **Produce — Fruit** | Berries, bananas, citrus, avocados, stone fruit, melon |
| **Fresh Herbs** | Cilantro, parsley, dill, basil, mint, rosemary, thyme |
| **Bulk Bins** | Anything named "bulk", trail mix, dried fruit, loose grains and nuts |
| **Bakery & Bread** | Sandwich bread, sourdough, tortillas, pita, naan, bagels, buns |
| **Deli & Prepared** | Sliced deli meats, rotisserie chicken, hummus, guacamole, salad kits |
| **Cheese** | Block, sliced, and crumbled cheese (not cream cheese or cottage cheese) |
| **Meat & Seafood** | Fresh-counter proteins bought same-week rather than in bulk |
| **Dairy & Eggs** | Yogurt, milk, butter, eggs, sour cream, cream cheese, creamers |
| **Frozen** | Anything frozen, including frozen produce and ice cream |
| **Grocery — Pantry** | Sauces, condiments, oils, spices, grains, pasta, beans, nut butters. **Fallback zone.** |
| **Grocery — Snacks** | Chips, crackers, pretzels, popcorn, rice cakes |
| **Grocery — Sweets** | Brownies, cookies, chocolate, candy, pastries |
| **Beverages** | Sparkling water, juice, kombucha, coffee, tea |
| **Beer & Wine** | Beer, wine, cider |
| **Vitamins & Body Care** | Supplements, sunscreen, shampoo, toothpaste |
| **Household** | Paper goods and cleaning supplies bought here rather than in bulk |

---

## Costco walk order

Dry pallets and household goods first, refrigerated and frozen last, so cold items spend
the least time in the cart.

```
 1. Bakery
 2. Dry Goods & Pantry
 3. Snacks & Sweets
 4. Beverages
 5. Paper & Household
 6. Cleaning & Laundry
 7. Health & Personal Care
 8. Deli & Prepared
 9. Meat & Seafood
10. Dairy & Eggs
11. Produce
12. Frozen
```

| Zone | What lands here |
|---|---|
| **Bakery** | Bread, bagels, croissants, tortillas |
| **Dry Goods & Pantry** | Oils, rice, pasta, canned goods, broth, nut butters. **Fallback zone.** |
| **Snacks & Sweets** | Chips, crackers, nuts, bars, candy |
| **Beverages** | Sparkling water, coffee, juice, electrolytes |
| **Paper & Household** | Toilet paper, paper towels, trash bags, foil, storage bags, batteries |
| **Cleaning & Laundry** | Detergent, dish soap, wipes, cleaners |
| **Health & Personal Care** | Vitamins, OTC medicine, toothpaste, shampoo, razors |
| **Deli & Prepared** | Rotisserie chicken, sliced deli meat, hummus, prepared kits |
| **Meat & Seafood** | Raw proteins bought in bulk to portion and freeze |
| **Dairy & Eggs** | Eggs, milk, butter, yogurt, shredded and block cheese |
| **Produce** | Bagged greens, berries, bulk vegetables |
| **Frozen** | Frozen shrimp, salmon, berries, vegetables |

---

## How an item gets routed

1. **An explicit `store` on the item always wins.** Ingredients in a week's JSON and
   staples in the catalog can set `"store": "sprouts"` or `"store": "costco"`.
2. Otherwise the defaults in `lib/stores/routing.ts` apply. Costco claims:
   - Raw meat and seafood (chicken thighs, ground beef, steak, salmon fillets, shrimp)
   - Freezer stock (frozen berries, frozen vegetables, frozen shrimp)
   - Paper, cleaning, and household goods
   - Large-format pantry staples (olive oil, bulk rice, canned tomatoes, broth)
3. Everything else goes to Sprouts.

Deli-counter and ready-to-eat versions of the same protein stay on the weekly list:
"sliced oven-roasted turkey breast" and "rotisserie chicken" go to Sprouts even though
"chicken thighs" and "ground beef" go to Costco.

### Practical notes

- **Meat on a dinner recipe means "from the freezer."** A dinner that calls for chicken
  thighs routes them to the Costco list. Check the freezer before the monthly run and
  mark items **Pantry** on the Costco tab if you are already stocked.
- **Frozen beats fresh in naming.** "Frozen green beans" goes to Frozen; "green beans"
  goes to Produce.
- **Cheese is its own Sprouts zone**, separate from Dairy & Eggs. Cream cheese and
  cottage cheese are Dairy.
- **Items named "Leftover ..." are never added to a list.** They are eaten, not bought.
- **Unrecognized items land in the store's pantry zone** with `fallback` confidence, and
  `npm run meal-plan -- validate` reports them so you can add a keyword rule.
