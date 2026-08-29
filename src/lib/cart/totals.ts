import type { CartItem } from "@/lib/cart/types";
import type { Money } from "@/lib/pricing/types";
import { isDrinkCartItem, isPotionCartItem } from "@/lib/cart/types";
import { calculatePotionPricing } from "@/lib/pricing/potionPricing";
import { calcTax, multiplyMoney, roundMoney } from "@/lib/pricing/calc";

export type CartTotals = {
    subtotal: Money;
    tax: Money;
    deliveryFee: Money;
    total: Money;
    hasUnresolvedPrice: boolean;
};

export function calcCartSubtotal(items: CartItem[]): Money {
    return roundMoney(
        items.reduce((sum, item) => {
            return sum + multiplyMoney(item.unitBasePrice, item.quantity);
        }, 0),
    );
}

export function calcCartTotals(
    items: CartItem[],
    options?: {
        taxRate?: number;
        deliveryFee?: Money;
    },
): CartTotals {
    const taxRate = options?.taxRate ?? 0;
    const deliveryFee = options?.deliveryFee ?? 0;

    const subtotal = calcCartSubtotal(items);
    const tax = calcTax(subtotal, taxRate);
    const total = roundMoney(subtotal + tax + deliveryFee);

    return {
        subtotal,
        tax,
        deliveryFee,
        total,
        hasUnresolvedPrice: items.some((item) =>
            item.comboType === "byo"
            || (isDrinkCartItem(item) && item.pricingState === "tbd")
            || (isPotionCartItem(item) && calculatePotionPricing(item).hasUnresolvedAdditionalFlavorPrice),
        ),
    };
}
