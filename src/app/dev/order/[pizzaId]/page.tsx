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
    searchParams: Promise<{ pair?: string }>;
}) {
    const { pizzaId } = await params;
    const { pair } = await searchParams;
    const pizza = pizzaId === "custom"
        ? null
        : MENU.pizzas.find((item) => item.id === pizzaId);

    if (pizzaId !== "custom" && !pizza) {
        notFound();
    }

    const pairedPotionId = pair && MENU.potions.some((item) => item.id === pair) ? pair : undefined;

    return <PizzaBuilder pizza={pizza ?? null} pairedPotionId={pairedPotionId} />;
}
