import { MENU } from "@/data/menu";
import type {
    Combo,
    Ingredient,
    LocationIngredientAvailability,
    MenuPizza,
    Potion,
} from "@/lib/menu/types";

export function getPizzaById(id: string): MenuPizza {
    const pizza = MENU.pizzas.find((item) => item.id === id);
    if (!pizza) {
        throw new Error(`Pizza not found: ${id}`);
    }
    return pizza;
}

export function getPotionById(id: string): Potion {
    const potion = MENU.potions.find((item) => item.id === id);
    if (!potion) {
        throw new Error(`Potion not found: ${id}`);
    }
    return potion;
}

export function getComboById(id: string): Combo {
    const combo = MENU.combos.find((item) => item.id === id);
    if (!combo) {
        throw new Error(`Combo not found: ${id}`);
    }
    return combo;
}

export function ingredientMap(): Map<string, Ingredient> {
    return new Map(MENU.ingredients.map((ingredient) => [ingredient.id, ingredient]));
}

export function getIngredientById(id: string): Ingredient {
    const ingredient = ingredientMap().get(id);
    if (!ingredient) {
        throw new Error(`Ingredient not found: ${id}`);
    }
    return ingredient;
}

export function getCrustOptions(): Ingredient[] {
    return MENU.ingredients
        .filter((ingredient) => ingredient.isCrustOption && ingredient.isActive)
        .sort((a, b) => a.buildOrder - b.buildOrder || a.name.localeCompare(b.name));
}

export function getNonCrustIngredients(): Ingredient[] {
    return MENU.ingredients
        .filter((ingredient) => !ingredient.isCrustOption && ingredient.isActive)
        .sort((a, b) => a.buildOrder - b.buildOrder || a.name.localeCompare(b.name));
}

export function sortIngredientIds(ids: string[]): string[] {
    const map = ingredientMap();

    return [...ids].sort((a, b) => {
        const ingredientA = map.get(a);
        const ingredientB = map.get(b);

        const orderA = ingredientA?.buildOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = ingredientB?.buildOrder ?? Number.MAX_SAFE_INTEGER;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        return (ingredientA?.name ?? a).localeCompare(ingredientB?.name ?? b);
    });
}

export type IngredientAvailabilityView = Ingredient & {
    isAvailable: boolean;
};

export function applyAvailability(
    ingredients: Ingredient[],
    availability: LocationIngredientAvailability[] | null | undefined,
): IngredientAvailabilityView[] {
    const availabilityMap = new Map<string, boolean>();

    for (const entry of availability ?? []) {
        availabilityMap.set(entry.ingredientId, entry.isAvailable);
    }

    return ingredients
        .filter((ingredient) => ingredient.isActive)
        .map((ingredient) => ({
            ...ingredient,
            isAvailable: availabilityMap.has(ingredient.id)
                ? Boolean(availabilityMap.get(ingredient.id))
                : true,
        }));
}

export function getGroupedPizzas(): Array<{
    group: string;
    pizzas: MenuPizza[];
}> {
    const groupMap = new Map<string, MenuPizza[]>();

    for (const pizza of MENU.pizzas) {
        const existing = groupMap.get(pizza.group) ?? [];
        existing.push(pizza);
        groupMap.set(pizza.group, existing);
    }

    return [...groupMap.entries()].map(([group, pizzas]) => ({
        group,
        pizzas,
    }));
}

export function getSauceOptions(): Ingredient[] {
    return getNonCrustIngredients().filter((ingredient) => ingredient.category === "sauce");
}

export function getCheeseOptions(): Ingredient[] {
    return getNonCrustIngredients().filter(
        (ingredient) => ingredient.category === "cheese" || ingredient.category === "vegan-cheese",
    );
}

export function getToppingOptions(): Ingredient[] {
    return getNonCrustIngredients().filter(
        (ingredient) => !["sauce", "cheese", "vegan-cheese", "drizzle"].includes(ingredient.category),
    );
}

export function getFinishOptions(): Ingredient[] {
    return getNonCrustIngredients().filter((ingredient) => ingredient.category === "drizzle");
}

/** Count only priced topping selections in a house recipe. Sauce, cheese, and
 * post-bake finishes are recipe layers but never consume topping units. */
export function getSignatureToppingUnits(pizza: MenuPizza): number {
    const toppingIds = new Set(getToppingOptions().map((ingredient) => ingredient.id));
    return pizza.preset.defaultPreBakeIngredientIds.filter((id) => toppingIds.has(id)).length;
}
