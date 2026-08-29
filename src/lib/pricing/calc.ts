import { BASE_PRICE } from "@/lib/pricing/priceTable";
import { getDerivedCrustPrice } from "@/lib/pricing/rules";
import type { CrustId, Money, PizzaSizeId } from "@/lib/pricing/types";

export function dollarsToCents(amount: Money): number {
    return Math.round(amount * 100);
}

export function centsToDollars(cents: number): Money {
    return Math.round(cents) / 100;
}

export function roundMoney(amount: number): Money {
    return Math.round(amount * 100) / 100;
}

export function getDirectBasePizzaPrice(
    sizeId: PizzaSizeId,
    crustId: Exclude<CrustId, "vegan" | "pizza-pocket"> | "regular",
): Money | null {
    const sizeRow = BASE_PRICE[sizeId];
    const directPrice = sizeRow?.[crustId];

    if (typeof directPrice !== "number") {
        return null;
    }

    return directPrice;
}

export function getBasePizzaPrice(
    sizeId: PizzaSizeId,
    crustId: CrustId,
): Money | null {
    const sizeRow = BASE_PRICE[sizeId];
    const directPrice = sizeRow?.[crustId];

    if (typeof directPrice === "number") {
        return directPrice;
    }

    const derivedPrice = getDerivedCrustPrice(sizeId, crustId);
    if (typeof derivedPrice === "number") {
        return derivedPrice;
    }

    return null;
}

export function requireBasePizzaPrice(
    sizeId: PizzaSizeId,
    crustId: CrustId,
): Money {
    const price = getBasePizzaPrice(sizeId, crustId);

    if (price === null) {
        throw new Error(`No base pizza price found for size "${sizeId}" and crust "${crustId}".`);
    }

    return price;
}

export function calcTax(subtotal: Money, taxRate: number): Money {
    return roundMoney(subtotal * taxRate);
}

export function multiplyMoney(amount: Money, quantity: number): Money {
    return roundMoney(amount * quantity);
}
