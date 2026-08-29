import DrinksBuilder from "./DrinksBuilder";

export default async function DrinksPage({ searchParams }: { searchParams: Promise<{ combo?: string; group?: string }> }) {
    const { combo, group } = await searchParams;
    return <DrinksBuilder comboId={combo === "byo-adventure" ? combo : undefined} comboGroupId={combo === "byo-adventure" ? group : undefined} />;
}
