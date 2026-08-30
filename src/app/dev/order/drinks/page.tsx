import DrinksBuilder from "./DrinksBuilder";

export default async function DrinksPage({ searchParams }: { searchParams: Promise<{ type?: string; combo?: string; group?: string }> }) {
    const { type, combo, group } = await searchParams;
    const requestedType = type === "fountain" || type === "energy" ? type : undefined;
    return <DrinksBuilder requestedType={requestedType} comboId={combo === "byo-adventure" ? combo : undefined} comboGroupId={combo === "byo-adventure" ? group : undefined} />;
}
