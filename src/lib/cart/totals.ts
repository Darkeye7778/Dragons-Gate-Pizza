import type { CartItem } from "@/lib/cart/types";
import { isDrinkCartItem, isPotionCartItem } from "@/lib/cart/types";
import { calcTax, multiplyMoney, roundMoney, roundToNearestNickel } from "@/lib/pricing/calc";
import { ADVENTURE_COMBO_DISCOUNT } from "@/lib/pricing/priceTable";
import type { Money } from "@/lib/pricing/types";

export type CartTotals = {
    subtotal: Money;
    comboDiscount: Money;
    discountedSubtotal: Money;
    tax: Money;
    deliveryFee: Money;
    exactTotal: Money;
    roundingAdjustment: Money;
    finalPayableTotal: Money;
    total: Money;
    hasUnresolvedPrice: boolean;
};

export function calcCartSubtotal(items: CartItem[]): Money {
    return roundMoney(
        items.reduce((sum, item) => sum + multiplyMoney(item.unitBasePrice, item.quantity), 0),
    );
}

export function calcAdventureComboDiscount(items: CartItem[]): Money {
    const groups = new Map<string, { pizzas: number; drinks: number }>();

    for (const item of items) {
        if (!item.comboGroupId) continue;
        const group = groups.get(item.comboGroupId) ?? { pizzas: 0, drinks: 0 };
        if (isDrinkCartItem(item) || isPotionCartItem(item)) group.drinks += item.quantity;
        else group.pizzas += item.quantity;
        groups.set(item.comboGroupId, group);
    }

    const completedCombos = [...groups.values()].reduce(
        (total, group) => total + Math.min(group.pizzas, group.drinks),
        0,
    );

    return roundMoney(completedCombos * ADVENTURE_COMBO_DISCOUNT);
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
    const comboDiscount = calcAdventureComboDiscount(items);
    const discountedSubtotal = roundMoney(Math.max(0, subtotal - comboDiscount));
    const tax = calcTax(discountedSubtotal, taxRate);
    const exactTotal = roundMoney(discountedSubtotal + tax + deliveryFee);
    const finalPayableTotal = roundToNearestNickel(exactTotal);
    const roundingAdjustment = roundMoney(finalPayableTotal - exactTotal);

    return {
        subtotal,
        comboDiscount,
        discountedSubtotal,
        tax,
        deliveryFee,
        exactTotal,
        roundingAdjustment,
        finalPayableTotal,
        total: finalPayableTotal,
        hasUnresolvedPrice: items.some(
            (item) => isDrinkCartItem(item) && item.pricingState === "tbd",
        ),
    };
}
