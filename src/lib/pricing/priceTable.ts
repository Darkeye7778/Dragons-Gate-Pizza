import type { BasePriceTable, PizzaSize } from "@/lib/pricing/types";

export const PIZZA_SIZES: PizzaSize[] = [
    { id: "kids_9", label: 'Kids (9")', inches: 9, sortOrder: 10 },
    { id: "personal_12", label: 'Personal (12")', inches: 12, sortOrder: 20 },
    { id: "medium_16", label: 'Medium (16")', inches: 16, sortOrder: 30 },
    { id: "large_20", label: 'Large (20")', inches: 20, sortOrder: 40 },
    { id: "xl_25", label: 'XL (25")', inches: 25, sortOrder: 50 },
];

export const DEFAULT_PIZZA_SIZE_ID = "medium_16";

/** Cheese-only prices from the final menu table. */
export const BASE_PRICE: BasePriceTable = {
    kids_9: {
        regular: 4.25,
        thin: 4.75,
        "high-rise": 5.0,
        "gluten-free": 6.25,
        cauliflower: 7.25,
        keto: 7.75,
    },
    personal_12: {
        regular: 5.66,
        thin: 6.16,
        "high-rise": 6.41,
        "gluten-free": 7.66,
        cauliflower: 8.66,
        keto: 9.16,
    },
    medium_16: {
        regular: 8.5,
        thin: 9.0,
        "high-rise": 9.25,
        "gluten-free": 10.5,
        cauliflower: 11.5,
        keto: 12.0,
    },
    large_20: {
        regular: 12.25,
        thin: 12.75,
        "high-rise": 13.0,
        "gluten-free": 14.25,
        cauliflower: 15.25,
        keto: 15.75,
    },
    xl_25: {
        regular: 17.25,
        thin: 17.75,
        "high-rise": 18.0,
        "gluten-free": 19.25,
        cauliflower: 20.25,
        keto: 20.75,
    },
};

export const STANDARD_TOPPING_UNIT_LIMIT = 5;
export const STANDARD_TOPPING_UNIT_PRICE = 0.5;
/** Menu BYO tier: toppings four and five share the $2.00 BYO charge. */
export const BUILD_YOUR_OWN_TOPPING_CHARGE = 2.0;
export const ADDITIONAL_TOPPING_UNIT_PRICE = 0.75;
export const PIZZA_POCKET_UPCHARGE = 1;

/**
 * Published anchor for every house signature recipe on a Personal (12\")
 * regular crust. Other signature sizes and crusts follow the difference in
 * the cheese-base table rather than being priced as BYO pizzas.
 */
export const SIGNATURE_PERSONAL_REGULAR_PRICE = 7.0;
