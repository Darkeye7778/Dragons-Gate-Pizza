import type { ToppingPlacement } from "@/lib/menu/types";
import { getBasePizzaPrice, roundMoney } from "@/lib/pricing/calc";
import {
    ADDITIONAL_TOPPING_UNIT_PRICE,
    BUILD_YOUR_OWN_TOPPING_CHARGE,
    SIGNATURE_PERSONAL_REGULAR_PRICE,
    STANDARD_TOPPING_UNIT_LIMIT,
    STANDARD_TOPPING_UNIT_PRICE,
} from "@/lib/pricing/priceTable";
import type { CrustId, Money, PizzaPriceTier, PizzaSizeId } from "@/lib/pricing/types";

export type ToppingSelectionForPricing = {
    ingredientId: string;
    placement: ToppingPlacement;
};

export type ToppingUnitCalculator = (selections: ToppingSelectionForPricing[]) => number;

/**
 * Provisional TU policy. The menu defines topping prices but does not define
 * how half, extra, double, or triple portions change TU. Until that rule is
 * supplied, each distinct topping is one TU and placement is visual.
 */
export const CURRENT_TU_POLICY_ID = "distinct-selection-v1";

export const calculateDistinctSelectionToppingUnits: ToppingUnitCalculator = (selections) =>
    new Set(selections.map((selection) => selection.ingredientId)).size;

export function calculateToppingUnits(
    selections: ToppingSelectionForPricing[],
    calculator: ToppingUnitCalculator = calculateDistinctSelectionToppingUnits,
): number {
    return Math.max(0, Math.floor(calculator(selections)));
}

export function getPizzaPriceTier(toppingUnits: number): PizzaPriceTier {
    if (toppingUnits === 0) return "cheese";
    if (toppingUnits === 1) return "one_top";
    if (toppingUnits === 2) return "two_top";
    if (toppingUnits === 3) return "three_top";
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
    signatureIncludedToppingUnits: number | null;
    cheeseBasePrice: Money;
    signatureBasePrice: Money | null;
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

export function getSignaturePizzaPrice(sizeId: PizzaSizeId, crustId: CrustId): Money {
    const selectedCheeseBase = requireBaseCheesePrice(sizeId, crustId);
    const anchorCheeseBase = requireBaseCheesePrice("personal_12", "regular");

    return roundMoney(SIGNATURE_PERSONAL_REGULAR_PRICE + selectedCheeseBase - anchorCheeseBase);
}

export function calculatePizzaPricing({
    sizeId,
    crustId,
    toppings,
    signaturePresetToppingUnits,
    toppingUnitCalculator,
}: PizzaPricingInput): PizzaPricingSnapshot {
    const toppingUnits = calculateToppingUnits(toppings, toppingUnitCalculator);
    const cheeseBasePrice = requireBaseCheesePrice(sizeId, crustId);

    if (typeof signaturePresetToppingUnits === "number") {
        const signatureIncludedToppingUnits = Math.max(0, Math.floor(signaturePresetToppingUnits));
        const additionalToppingUnits = Math.max(0, toppingUnits - signatureIncludedToppingUnits);
        const additionalToppingCharge = roundMoney(additionalToppingUnits * ADDITIONAL_TOPPING_UNIT_PRICE);
        const signatureBasePrice = getSignaturePizzaPrice(sizeId, crustId);

        return {
            mode: "signature",
            tier: "signature",
            tierLabel: "Signature recipe",
            toppingUnits,
            standardToppingUnits: Math.min(toppingUnits, signatureIncludedToppingUnits),
            additionalToppingUnits,
            signatureIncludedToppingUnits,
            cheeseBasePrice,
            signatureBasePrice,
            standardToppingCharge: 0,
            additionalToppingCharge,
            toppingCharge: additionalToppingCharge,
            unitPrice: roundMoney(signatureBasePrice + additionalToppingCharge),
            priceSource: "signature-anchor",
            tuPolicyId: CURRENT_TU_POLICY_ID,
        };
    }

    const tier = getPizzaPriceTier(toppingUnits);
    const standardToppingUnits = Math.min(toppingUnits, STANDARD_TOPPING_UNIT_LIMIT);
    const additionalToppingUnits = Math.max(0, toppingUnits - STANDARD_TOPPING_UNIT_LIMIT);
    const standardToppingCharge = toppingUnits >= 4
        ? BUILD_YOUR_OWN_TOPPING_CHARGE
        : roundMoney(standardToppingUnits * STANDARD_TOPPING_UNIT_PRICE);
    const additionalToppingCharge = roundMoney(additionalToppingUnits * ADDITIONAL_TOPPING_UNIT_PRICE);
    const toppingCharge = roundMoney(standardToppingCharge + additionalToppingCharge);

    return {
        mode: "custom",
        tier,
        tierLabel: PIZZA_TIER_LABELS[tier],
        toppingUnits,
        standardToppingUnits,
        additionalToppingUnits,
        signatureIncludedToppingUnits: null,
        cheeseBasePrice,
        signatureBasePrice: null,
        standardToppingCharge,
        additionalToppingCharge,
        toppingCharge,
        unitPrice: roundMoney(cheeseBasePrice + toppingCharge),
        priceSource: "base-cheese-table",
        tuPolicyId: CURRENT_TU_POLICY_ID,
    };
}
