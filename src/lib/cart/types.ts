import type { CrustId, Money, PizzaSizeId } from "@/lib/pricing/types";

export type PizzaCartItem = {
    id: string;
    pizzaId: string;

    sizeId: PizzaSizeId;
    crustId: CrustId;

    preBakeIngredientIds: string[];
    postBakeIngredientIds: string[];

    quantity: number;

    unitBasePrice: Money;
};

export type CartItem = PizzaCartItem;