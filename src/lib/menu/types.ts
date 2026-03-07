export type FulfillmentType = "pickup" | "delivery" | "dine_in";

export type Ingredient = {
    id: string;
    name: string;
    buildOrder: number;
    isCrustOption: boolean;
    isActive: boolean;
};

export type PizzaPreset = {
    defaultPreBakeIngredientIds: string[];
    defaultPostBakeIngredientIds: string[];
};

export type MenuPizza = {
    id: string;
    name: string;
    group: string;
    description: string;
    preset: PizzaPreset;
};

export type Potion = {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    hasShimmer: boolean;
};

export type EnergyAddIn = {
    id: string;
    name: string;
    priceDelta: number;
};

export type Combo = {
    id: string;
    name: string;
    pizzaId: string;
    potionOptions: string[];
};

export type MenuCatalog = {
    ingredients: Ingredient[];
    pizzas: MenuPizza[];
    potions: Potion[];
    energyOptions: string[];
    energyAddIns: EnergyAddIn[];
    combos: Combo[];
};

export type Location = {
    id: string;
    name: string;
    isEnabled: boolean;
};

export type LocationIngredientAvailability = {
    locationId: string;
    ingredientId: string;
    isAvailable: boolean;
    updatedAtISO?: string;
};