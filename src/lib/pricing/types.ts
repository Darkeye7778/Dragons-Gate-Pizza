export type PizzaSizeId =
    | "kids_9"
    | "personal_12"
    | "medium_16"
    | "large_20"
    | "xl_25";

export type CrustId =
    | "regular"
    | "thin"
    | "high-rise"
    | "gluten-free"
    | "cauliflower"
    | "keto"
    | "vegan";

export type Money = number;

export type PizzaSize = {
    id: PizzaSizeId;
    label: string;
    inches: number;
    sortOrder: number;
};

export type BasePriceTable = {
    [size in PizzaSizeId]: Partial<Record<CrustId, Money>>;
};