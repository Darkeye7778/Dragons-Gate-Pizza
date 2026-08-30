import DrinksBuilder from "./DrinksBuilder";
import PotionBuilder from "../potion/[potionId]/PotionBuilder";

export default async function DrinksPage({ searchParams }: { searchParams: Promise<{ type?: string; combo?: string; group?: string }> }) {
    const { type, combo, group } = await searchParams;
    const requestedType = type === "fountain" || type === "energy" ? type : undefined;
    const comboId = combo === "byo-adventure" ? combo : undefined;
    const comboGroupId = comboId ? group : undefined;

    if (requestedType === "fountain") {
        return <PotionBuilder potion={null} comboId={comboId} comboGroupId={comboGroupId} />;
    }

    return <DrinksBuilder requestedType={requestedType} comboId={comboId} comboGroupId={comboGroupId} />;
}
