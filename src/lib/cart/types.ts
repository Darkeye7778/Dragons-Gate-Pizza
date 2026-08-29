import type { CrustId, Money, PizzaSizeId } from "@/lib/pricing/types";

import type { ToppingPlacement } from "@/lib/menu/types";
import type { PizzaPricingSnapshot } from "@/lib/pricing/pizzaPricing";
import type { PocketDoughId } from "@/lib/pricing/types";

export type { ToppingPlacement } from "@/lib/menu/types";

export type PizzaCutStyle =
    | "uncut"
    | "three-slice"
    | "four-slice"
    | "six-slice"
    | "eight-slice"
    | "square";

export const PIZZA_CUT_LABELS: Record<PizzaCutStyle, string> = {
    uncut: "Uncut",
    "three-slice": "3 slices",
    "four-slice": "4 slices",
    "six-slice": "6 slices",
    "eight-slice": "8 slices",
    square: "Square cut",
};

export type PizzaCartItem = {
    kind?: "pizza";
    id: string;
    pizzaId: string;

    sizeId: PizzaSizeId;
    crustId: CrustId;
    pocketDoughId?: PocketDoughId;

    preBakeIngredientIds: string[];
    postBakeIngredientIds: string[];
    toppingPlacements?: Record<string, ToppingPlacement>;
    finishPlacements?: Record<string, ToppingPlacement>;
    cutStyle?: PizzaCutStyle;

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
