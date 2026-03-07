import { getDirectBasePizzaPrice } from "@/lib/pricing/calc";
import type { CrustId, Money, PizzaSizeId } from "@/lib/pricing/types";

function roundMoney(value: number): Money {
    return Math.round(value * 100) / 100;
}

export function getDerivedCrustPrice(
    sizeId: PizzaSizeId,
    crustId: CrustId,
): Money | null {
    if (crustId === "vegan") {
        const regularPrice = getDirectBasePizzaPrice(sizeId, "regular");
        if (regularPrice === null) {
            return null;
        }

        return roundMoney(regularPrice + 1);
    }

    return null;
}