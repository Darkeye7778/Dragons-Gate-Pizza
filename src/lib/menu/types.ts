export type FulfillmentType = "pickup" | "delivery" | "dine_in";

export type MajorAllergen = "milk" | "egg" | "wheat" | "soy" | "sesame" | "peanut" | "tree-nut" | "fish" | "shellfish";

export type IngredientCategory =
    | "crust"
    | "sauce"
    | "cheese"
    | "vegan-cheese"
    | "meat"
    | "vegan-meat"
    | "vegetable"
    | "seasonal-vegetable"
    | "fruit"
    | "herb-garnish"
    | "specialty-sauce"
    | "drizzle";

export type Ingredient = {
    id: string;
    name: string;
    buildOrder: number;
    isCrustOption: boolean;
    isActive: boolean;
    category: IngredientCategory;
    isVegan?: boolean;
    isGlutenFreeIngredient?: boolean;
    allergens?: MajorAllergen[];
    recipeFamily?: "regular-butter-dough" | "gluten-free-dough" | "vegan-dough" | "cauliflower" | "keto";
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
    description?: string;
    basePrice: number;
    defaultShimmerId: string;
    defaultBaseId?: string;
    defaultFlavorIds?: string[];
};

export type DrinkOption = { id: string; name: string };

export type PotionEnhancement = DrinkOption & {
    priceDelta: number;
    isVegan?: boolean;
    allergens?: MajorAllergen[];
};

export type EnergyBrand = DrinkOption & {
    variants: DrinkOption[];
};

export type EnergyAddIn = {
    id: string;
    name: string;
    priceDelta: number;
};

export type Combo = {
    id: string;
    name: string;
    pizzaName: string;
    pizzaId?: string;
    potionId: string;
    shimmerId: string;
};

export type MenuCatalog = {
    ingredients: Ingredient[];
    pizzas: MenuPizza[];
    potions: Potion[];
    drinkBases: DrinkOption[];
    potionFlavors: DrinkOption[];
    potionEnhancements: PotionEnhancement[];
    shimmers: DrinkOption[];
    energyBrands: EnergyBrand[];
    energyAddIns: EnergyAddIn[];
    buildYourOwnPotionPrice: number;
    straightEnergyDrinkPrice: number;
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

export type ToppingPlacement = "whole" | "left" | "right";
