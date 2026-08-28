import type { CrustId, Money, PizzaSizeId } from "@/lib/pricing/types";

import type { ToppingPlacement } from "@/lib/menu/types";
import type { PizzaPricingSnapshot } from "@/lib/pricing/pizzaPricing";

export type { ToppingPlacement } from "@/lib/menu/types";

export type PizzaCartItem = {
    kind?: "pizza";
    id: string;
    pizzaId: string;

    sizeId: PizzaSizeId;
    crustId: CrustId;

    preBakeIngredientIds: string[];
    postBakeIngredientIds: string[];
    toppingPlacements?: Record<string, ToppingPlacement>;

    quantity: number;

    unitBasePrice: Money;
    pricing?: PizzaPricingSnapshot;
};

export type PotionCartItem = {
    kind: "potion";
    id: string;
    potionId: string;
    baseId?: string;
    flavorIds: string[];
    enhancementIds: string[];
    shimmerIds: string[];
    energyBrandId?: string;
    energyVariantId?: string;
    energyAddInId?: string;
    quantity: number;
    unitBasePrice: Money;
};

export type CartItem = PizzaCartItem | PotionCartItem;

export function isPotionCartItem(item: CartItem): item is PotionCartItem {
    return item.kind === "potion";
}
