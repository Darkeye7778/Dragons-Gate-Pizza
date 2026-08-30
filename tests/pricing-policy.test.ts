import assert from "node:assert/strict";
import { calcCartTotals } from "@/lib/cart/totals";
import type { CartItem } from "@/lib/cart/types";
import { roundToNearestNickel } from "@/lib/pricing/calc";
import { calculatePizzaPricing, getToppingUnitWeight, type ToppingSelectionForPricing } from "@/lib/pricing/pizzaPricing";
import { calculatePotionPricing } from "@/lib/pricing/potionPricing";

const amountWeights = {
    light: 0.5,
    normal: 1,
    extra: 1.5,
    double: 2,
    triple: 3,
} as const;

for (const [amount, expected] of Object.entries(amountWeights)) {
    assert.equal(getToppingUnitWeight(amount as keyof typeof amountWeights), expected);
}

function customPizzaAtTU(toppingUnits: number) {
    const toppings: ToppingSelectionForPricing[] = [];
    let remaining = toppingUnits;
    let index = 0;
    while (remaining > 0) {
        const amount = remaining >= 3 ? "triple" : remaining >= 2 ? "double" : remaining >= 1.5 ? "extra" : remaining >= 1 ? "normal" : "light";
        toppings.push({ ingredientId: `topping-${index}`, placement: index % 2 ? "left" as const : "whole" as const, amount });
        remaining -= getToppingUnitWeight(amount);
        index += 1;
    }
    return calculatePizzaPricing({ sizeId: "personal_12", crustId: "regular", toppings });
}

for (const [toppingUnits, expectedCharge] of [[5, 0], [5.5, 0], [6, 0.75], [6.5, 0.75], [7, 1.5]] as const) {
    const pricing = customPizzaAtTU(toppingUnits);
    assert.equal(pricing.toppingUnits, toppingUnits);
    assert.equal(pricing.additionalToppingCharge, expectedCharge);
}

assert.equal(customPizzaAtTU(0.5).tier, "one_top");
assert.equal(customPizzaAtTU(0.5).standardToppingCharge, 0.25);
assert.equal(customPizzaAtTU(1.5).tier, "one_top");
assert.equal(customPizzaAtTU(1.5).standardToppingCharge, 0.75);
for (const placement of ["whole", "left", "right"] as const) {
    const pricing = calculatePizzaPricing({
        sizeId: "personal_12",
        crustId: "regular",
        toppings: [{ ingredientId: "pepperoni", placement, amount: "double" }],
    });
    assert.equal(pricing.toppingUnits, 2);
}

function potionPrice(potionId: string, flavorIds: string[], enhancementIds: string[] = []) {
    return calculatePotionPricing({ potionId, flavorIds, enhancementIds }).unitPrice;
}

assert.equal(potionPrice("custom", []), 2.49);
assert.equal(potionPrice("custom", ["cherry"]), 3.49);
assert.equal(potionPrice("custom", ["cherry", "vanilla"]), 3.49);
assert.equal(potionPrice("custom", ["cherry", "vanilla", "lime"]), 3.99);
assert.equal(potionPrice("custom", ["cherry", "vanilla", "lime", "mango"]), 4.49);
assert.equal(potionPrice("mana-burst", ["blue-raspberry", "coconut-cream"]), 3.99);
assert.equal(potionPrice("bardic-inspiration", ["cherry", "vanilla", "lime"]), 3.99);
assert.equal(potionPrice("bardic-inspiration", ["mango", "pineapple", "strawberry"]), 3.99);
assert.equal(potionPrice("bardic-inspiration", ["cherry", "vanilla", "lime", "mango"]), 4.49);
assert.equal(potionPrice("health-potion", ["strawberry", "vanilla-cream"], ["whipped-cream"]), 3.99);
assert.equal(potionPrice("health-potion", ["strawberry", "vanilla-cream"], ["dairy-cream"]), 3.99);
assert.equal(potionPrice("health-potion", ["strawberry", "vanilla-cream"], ["whipped-cream", "dairy-cream"]), 4.49);

function comboItems(drinkPrice: number): CartItem[] {
    return [
        {
            kind: "pizza", id: "pizza", pizzaId: "custom", sizeId: "personal_12", crustId: "regular",
            preBakeIngredientIds: [], postBakeIngredientIds: [], quantity: 1, unitBasePrice: 7,
            comboId: "byo-adventure", comboType: "byo", comboGroupId: "combo-test",
        },
        {
            kind: "potion", id: "drink", potionId: "custom", baseId: "cola", flavorIds: [],
            enhancementIds: [], shimmerIds: [], quantity: 1, unitBasePrice: drinkPrice,
            comboId: "byo-adventure", comboType: "byo", comboGroupId: "combo-test",
        },
    ];
}

for (const [drinkPrice, exactTotal] of [[2.49, 7.99], [3.49, 8.99], [3.99, 9.49]] as const) {
    const totals = calcCartTotals(comboItems(drinkPrice));
    assert.equal(totals.comboDiscount, 1.5);
    assert.equal(totals.exactTotal, exactTotal);
}

const curatedItems = comboItems(3.99).map((item) => ({
    ...item,
    comboId: "combo-human-champion",
    comboType: "curated" as const,
}));
assert.equal(calcCartTotals(curatedItems).comboDiscount, 1.5);

for (const [exact, rounded] of [[7.99, 8], [8.99, 9], [9.49, 9.5], [9.47, 9.45], [9.48, 9.5]] as const) {
    assert.equal(roundToNearestNickel(exact), rounded);
}
assert.equal(calcCartTotals(comboItems(3.99)).roundingAdjustment, 0.01);

console.log("Pricing policy tests passed.");
