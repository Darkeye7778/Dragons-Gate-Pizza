import type { MenuCatalog } from "@/lib/menu/types";

const CANONICAL_PIZZAS = [
    "human-champion", "dwarven-defender", "elvish-druid", "tiefling-warlock",
    "halfling-ranger", "drow-assassin", "dragonborn-paladin", "aasimar-cleric",
    "gnome-artificer", "orc-berserker", "half-elf-bard", "tabaxi-rogue",
];

const CANONICAL_POTIONS = [
    "mana-burst", "health-potion", "arcane-spark", "inferno-brew",
    "forest-nectar", "frost-mages-elixir", "dragons-breath-fizz", "elven-bloom",
    "goblin-grease", "golden-hoard-creamsicle", "bardic-inspiration", "feline-agility",
];

const CANONICAL_TOPPING_COUNTS: Record<string, number> = {
    "human-champion": 5, "dwarven-defender": 5, "elvish-druid": 4, "tiefling-warlock": 3,
    "halfling-ranger": 4, "drow-assassin": 3, "dragonborn-paladin": 4, "aasimar-cleric": 4,
    "gnome-artificer": 3, "orc-berserker": 4, "half-elf-bard": 3, "tabaxi-rogue": 3,
};

export function validateMenuCatalog(menu: MenuCatalog): string[] {
    const errors: string[] = [];
    const ingredientIds = new Set(menu.ingredients.map((item) => item.id));
    const pizzaIds = new Set(menu.pizzas.map((item) => item.id));
    const potionIds = new Set(menu.potions.map((item) => item.id));
    const baseIds = new Set(menu.drinkBases.map((item) => item.id));
    const flavorIds = new Set(menu.potionFlavors.map((item) => item.id));
    const enhancementIds = new Set(menu.potionEnhancements.map((item) => item.id));
    const shimmerIds = new Set(menu.shimmers.map((item) => item.id));

    if (menu.pizzas.length !== 12 || CANONICAL_PIZZAS.some((id) => !pizzaIds.has(id))) errors.push("Signature pizza roster must contain the canonical 12.");
    if (menu.potions.length !== 12 || CANONICAL_POTIONS.some((id) => !potionIds.has(id))) errors.push("Signature potion roster must contain the canonical 12.");
    if (menu.combos.length !== 12) errors.push("Curated combo roster must contain exactly 12 entries.");
    if (new Set(menu.combos.map((combo) => combo.pizzaId)).size !== menu.combos.length) errors.push("Curated combos cannot duplicate a pizza.");

    for (const pizza of menu.pizzas) {
        for (const id of [...pizza.preset.defaultPreBakeIngredientIds, ...pizza.preset.defaultPostBakeIngredientIds]) {
            if (!ingredientIds.has(id)) errors.push(`${pizza.id} references unknown ingredient ${id}.`);
        }
        const toppingCount = pizza.preset.defaultPreBakeIngredientIds.filter((id) => {
            const ingredient = menu.ingredients.find((item) => item.id === id);
            return ingredient && ingredient.stage !== "post-bake" && !["sauce", "cheese", "vegan-cheese"].includes(ingredient.category);
        }).length;
        if (toppingCount !== CANONICAL_TOPPING_COUNTS[pizza.id]) errors.push(`${pizza.id} must contain ${CANONICAL_TOPPING_COUNTS[pizza.id]} canonical toppings; found ${toppingCount}.`);
    }
    for (const potion of menu.potions) {
        if (!baseIds.has(potion.defaultBaseId)) errors.push(`${potion.id} references unknown base ${potion.defaultBaseId}.`);
        for (const id of potion.defaultFlavorIds) if (!flavorIds.has(id)) errors.push(`${potion.id} references unknown flavor ${id}.`);
        for (const id of potion.defaultEnhancementIds) if (!enhancementIds.has(id)) errors.push(`${potion.id} references unknown enhancement ${id}.`);
        for (const id of potion.defaultShimmerIds) if (!shimmerIds.has(id)) errors.push(`${potion.id} references unknown shimmer ${id}.`);
    }
    for (const combo of menu.combos) {
        if (!pizzaIds.has(combo.pizzaId)) errors.push(`${combo.id} references unknown pizza ${combo.pizzaId}.`);
        if (!potionIds.has(combo.potionId)) errors.push(`${combo.id} references unknown potion ${combo.potionId}.`);
        for (const id of combo.shimmerIds) if (!shimmerIds.has(id)) errors.push(`${combo.id} references unknown shimmer ${id}.`);
    }

    const health = menu.potions.find((item) => item.id === "health-potion");
    if (!health?.defaultEnhancementIds.includes("whipped-cream")) errors.push("Health Potion must include Whipped Cream.");
    const aasimar = menu.pizzas.find((item) => item.id === "aasimar-cleric");
    if (aasimar?.preset.defaultToppingAmounts?.basil !== "light") errors.push("Aasimar Cleric Basil must default to Light.");
    const arugula = menu.ingredients.find((item) => item.id === "arugula");
    if (arugula?.stage !== "post-bake") errors.push("Arugula must resolve as a post-bake finish.");

    return errors;
}
