import { notFound } from "next/navigation";
import { MENU } from "@/data/menu";
import PizzaBuilder from "./PizzaBuilder";

export function generateStaticParams() {
    return [
        { pizzaId: "custom" },
        ...MENU.pizzas.map((pizza) => ({ pizzaId: pizza.id })),
    ];
}

export default async function PizzaBuilderPage({
    params,
    searchParams,
}: {
    params: Promise<{ pizzaId: string }>;
    searchParams: Promise<{ pair?: string; combo?: string; drink?: string }>;
}) {
    const { pizzaId } = await params;
    const { pair, combo, drink } = await searchParams;
    const pizza = pizzaId === "custom"
        ? null
        : MENU.pizzas.find((item) => item.id === pizzaId);

    if (pizzaId !== "custom" && !pizza) {
        notFound();
    }

    const pairedPotionId = pair === "custom" || (pair && MENU.potions.some((item) => item.id === pair)) ? pair : undefined;
    const comboId = combo === "byo-adventure" || MENU.combos.some((item) => item.id === combo) ? combo : undefined;

    return <PizzaBuilder pizza={pizza ?? null} pairedPotionId={pairedPotionId} pairedDrinkPath={drink === "standalone" ? "/dev/order/drinks" : undefined} comboId={comboId} />;
}
