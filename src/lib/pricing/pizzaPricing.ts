import type { ToppingAmount, ToppingPlacement } from "@/lib/menu/types";
import { getBasePizzaPrice, roundMoney } from "@/lib/pricing/calc";
import {
    ADDITIONAL_TOPPING_UNIT_PRICE,
    BUILD_YOUR_OWN_TOPPING_CHARGE,
    PIZZA_POCKET_UPCHARGE,
    SIGNATURE_PERSONAL_REGULAR_PRICE,
    STANDARD_TOPPING_UNIT_LIMIT,
    STANDARD_TOPPING_UNIT_PRICE,
} from "@/lib/pricing/priceTable";
import type { CrustId, Money, PizzaPriceTier, PizzaSizeId, PocketDoughId } from "@/lib/pricing/types";

export type ToppingSelectionForPricing = {
    ingredientId: string;
    placement: ToppingPlacement;
    amount?: ToppingAmount;
};

export type ToppingUnitCalculator = (selections: ToppingSelectionForPricing[]) => number;

export const CURRENT_TU_POLICY_ID = "weighted-amount-v2";

export const TOPPING_UNIT_WEIGHTS: Record<ToppingAmount, number> = {
    light: 0.5,
    normal: 1,
    extra: 1.5,
    double: 2,
    triple: 3,
};

export function getToppingUnitWeight(amount: ToppingAmount): number {
    return TOPPING_UNIT_WEIGHTS[amount];
}

export const calculateWeightedToppingUnits: ToppingUnitCalculator = (selections) =>
    [...new Map(selections.map((selection) => [selection.ingredientId, selection])).values()]
        .reduce((total, selection) => total + getToppingUnitWeight(selection.amount ?? "normal"), 0);

export function calculateToppingUnits(
    selections: ToppingSelectionForPricing[],
    calculator: ToppingUnitCalculator = calculateWeightedToppingUnits,
): number {
    return Math.max(0, calculator(selections));
}

export function getPizzaPriceTier(toppingUnits: number): PizzaPriceTier {
    if (toppingUnits <= 0) return "cheese";
    if (toppingUnits < 2) return "one_top";
    if (toppingUnits < 3) return "two_top";
    if (toppingUnits < 4) return "three_top";
    return "byo";
}

export const PIZZA_TIER_LABELS: Record<PizzaPriceTier, string> = {
    cheese: "Cheese",
    one_top: "1 Top",
    two_top: "2 Top",
    three_top: "3 Top",
    byo: "Build Your Own",
};

export type PizzaPricingSnapshot = {
    mode: "custom" | "signature";
    tier: PizzaPriceTier | "signature";
    tierLabel: string;
    toppingUnits: number;
    standardToppingUnits: number;
    additionalToppingUnits: number;
    completedAdditionalToppingUnits: number;
    signatureIncludedToppingUnits: number | null;
    cheeseBasePrice: Money;
    signatureBasePrice: Money | null;
    pocketDoughId: PocketDoughId | null;
    pizzaPocketCharge: Money;
    standardToppingCharge: Money;
    additionalToppingCharge: Money;
    toppingCharge: Money;
    unitPrice: Money;
    priceSource: "base-cheese-table" | "signature-anchor";
    tuPolicyId: typeof CURRENT_TU_POLICY_ID;
};

type PizzaPricingInput = {
    sizeId: PizzaSizeId;
    crustId: CrustId;
    pocketDoughId?: PocketDoughId;
    toppings: ToppingSelectionForPricing[];
    signaturePresetToppingUnits?: number;
    toppingUnitCalculator?: ToppingUnitCalculator;
};

function requireBaseCheesePrice(sizeId: PizzaSizeId, crustId: CrustId): Money {
    const price = getBasePizzaPrice(sizeId, crustId);
    if (price === null) {
        throw new Error(`No base-cheese price for size "${sizeId}" and crust "${crustId}".`);
    }
    return price;
}

export function getSignaturePizzaPrice(sizeId: PizzaSizeId, crustId: CrustId, pocketDoughId: PocketDoughId = "regular"): Money {
    const pricedCrustId = crustId === "pizza-pocket" ? pocketDoughId : crustId;
    const selectedCheeseBase = requireBaseCheesePrice(sizeId, pricedCrustId);
    const anchorCheeseBase = requireBaseCheesePrice("personal_12", "regular");

    return roundMoney(
        SIGNATURE_PERSONAL_REGULAR_PRICE
        + selectedCheeseBase
        - anchorCheeseBase
        + (crustId === "pizza-pocket" ? PIZZA_POCKET_UPCHARGE : 0),
    );
}

export function calculatePizzaPricing({
    sizeId,
    crustId,
    pocketDoughId,
    toppings,
    signaturePresetToppingUnits,
    toppingUnitCalculator,
}: PizzaPricingInput): PizzaPricingSnapshot {
    const selectedPocketDough = crustId === "pizza-pocket" ? (pocketDoughId ?? "regular") : null;
    const pricedCrustId = selectedPocketDough ?? crustId;
    const pizzaPocketCharge = selectedPocketDough ? PIZZA_POCKET_UPCHARGE : 0;
    const toppingUnits = calculateToppingUnits(toppings, toppingUnitCalculator);
    const cheeseBasePrice = requireBaseCheesePrice(sizeId, pricedCrustId);

    if (typeof signaturePresetToppingUnits === "number") {
        const signatureIncludedToppingUnits = Math.max(0, signaturePresetToppingUnits);
        const additionalToppingUnits = Math.max(0, toppingUnits - signatureIncludedToppingUnits);
        const completedAdditionalToppingUnits = Math.floor(additionalToppingUnits);
        const additionalToppingCharge = roundMoney(completedAdditionalToppingUnits * ADDITIONAL_TOPPING_UNIT_PRICE);
        const signatureBasePrice = getSignaturePizzaPrice(sizeId, pricedCrustId);

        return {
            mode: "signature",
            tier: "signature",
            tierLabel: "Signature recipe",
            toppingUnits,
            standardToppingUnits: Math.min(toppingUnits, signatureIncludedToppingUnits),
            additionalToppingUnits,
            completedAdditionalToppingUnits,
            signatureIncludedToppingUnits,
            cheeseBasePrice,
            signatureBasePrice,
            pocketDoughId: selectedPocketDough,
            pizzaPocketCharge,
            standardToppingCharge: 0,
            additionalToppingCharge,
            toppingCharge: additionalToppingCharge,
            unitPrice: roundMoney(signatureBasePrice + additionalToppingCharge + pizzaPocketCharge),
            priceSource: "signature-anchor",
            tuPolicyId: CURRENT_TU_POLICY_ID,
        };
    }

    const tier = getPizzaPriceTier(toppingUnits);
    const standardToppingUnits = Math.min(toppingUnits, STANDARD_TOPPING_UNIT_LIMIT);
    const additionalToppingUnits = Math.max(0, toppingUnits - STANDARD_TOPPING_UNIT_LIMIT);
    const completedAdditionalToppingUnits = Math.floor(additionalToppingUnits);
    const standardToppingCharge = toppingUnits >= 4
        ? BUILD_YOUR_OWN_TOPPING_CHARGE
        : roundMoney(standardToppingUnits * STANDARD_TOPPING_UNIT_PRICE);
    const additionalToppingCharge = roundMoney(completedAdditionalToppingUnits * ADDITIONAL_TOPPING_UNIT_PRICE);
    const toppingCharge = roundMoney(standardToppingCharge + additionalToppingCharge);

    return {
        mode: "custom",
        tier,
        tierLabel: PIZZA_TIER_LABELS[tier],
        toppingUnits,
        standardToppingUnits,
        additionalToppingUnits,
        completedAdditionalToppingUnits,
        signatureIncludedToppingUnits: null,
        cheeseBasePrice,
        signatureBasePrice: null,
        pocketDoughId: selectedPocketDough,
        pizzaPocketCharge,
        standardToppingCharge,
        additionalToppingCharge,
        toppingCharge,
        unitPrice: roundMoney(cheeseBasePrice + toppingCharge + pizzaPocketCharge),
        priceSource: "base-cheese-table",
        tuPolicyId: CURRENT_TU_POLICY_ID,
    };
}
