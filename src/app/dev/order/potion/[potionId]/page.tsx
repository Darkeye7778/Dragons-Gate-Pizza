import { notFound } from "next/navigation";
import { MENU } from "@/data/menu";
import PotionBuilder from "./PotionBuilder";

export function generateStaticParams() {
    return [
        { potionId: "custom" },
        ...MENU.potions.map((potion) => ({ potionId: potion.id })),
    ];
}

export default async function PotionBuilderPage({ params, searchParams }: { params: Promise<{ potionId: string }>; searchParams: Promise<{ combo?: string; group?: string }> }) {
    const { potionId } = await params;
    const { combo, group } = await searchParams;
    const potion = potionId === "custom" ? null : MENU.potions.find((item) => item.id === potionId);

    if (potionId !== "custom" && !potion) notFound();

    const comboId = combo === "byo-adventure" || MENU.combos.some((item) => item.id === combo) ? combo : undefined;
    return <PotionBuilder potion={potion ?? null} comboId={comboId} comboGroupId={comboId ? group : undefined} />;
}
