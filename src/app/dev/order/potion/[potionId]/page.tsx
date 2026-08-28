import { notFound } from "next/navigation";
import { MENU } from "@/data/menu";
import PotionBuilder from "./PotionBuilder";

export function generateStaticParams() {
    return [
        { potionId: "custom" },
        ...MENU.potions.map((potion) => ({ potionId: potion.id })),
    ];
}

export default async function PotionBuilderPage({ params }: { params: Promise<{ potionId: string }> }) {
    const { potionId } = await params;
    const potion = potionId === "custom" ? null : MENU.potions.find((item) => item.id === potionId);

    if (potionId !== "custom" && !potion) notFound();

    return <PotionBuilder potion={potion ?? null} />;
}
