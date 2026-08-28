import Link from "next/link";
import { MENU } from "@/data/menu";
import { getGroupedPizzas, getNonCrustIngredients, getCrustOptions } from "@/lib/menu/catalog";

export default function DevMenuPage() {
    const groupedPizzas = getGroupedPizzas();
    const crustOptions = getCrustOptions();
    const nonCrustIngredients = getNonCrustIngredients();
    const sauces = nonCrustIngredients.filter((item) => item.buildOrder === 20);
    const cheeses = nonCrustIngredients.filter((item) => item.buildOrder === 30);
    const toppings = nonCrustIngredients.filter((item) => item.buildOrder >= 40 && item.buildOrder < 90);
    const finishes = nonCrustIngredients.filter((item) => item.buildOrder >= 90);
    const ingredientGroups = [
        ["Crusts", crustOptions],
        ["Sauces", sauces],
        ["Cheeses", cheeses],
        ["Toppings", toppings],
        ["Finishes", finishes],
    ] as const;

    return (
        <main className="dev-catalog-page dev-menu-page">
            <header className="dev-catalog-hero">
                <span className="dev-section-kicker">The developing bill of fare</span>
                <h1>Dragon&apos;s Gate Pizza Menu</h1>
                <p>Browse the full menu, explore ingredients, and jump straight into ordering anything you want.</p>
            </header>

            <nav className="dev-catalog-actions" aria-label="Menu actions">
                <Link href="/dev/order">Start an Order</Link>
                <Link href="/dev/cart">View Cart</Link>
            </nav>

            <section className="dev-menu-build">
                <div>
                    <span>Forge your own</span>
                    <h2>Build Your Own Pizza</h2>
                    <p>Choose your size, crust, pre-bake ingredients, and finishes after the bake line.</p>
                </div>
                <Link href="/dev/order/custom">Build Your Own</Link>
            </section>

            <section className="dev-catalog-section">
                <header className="dev-catalog-section-heading">
                    <span>House recipes</span>
                    <h2>Signature Pizzas</h2>
                </header>

                {groupedPizzas.map((group) => (
                    <section className="dev-menu-group" key={group.group}>
                        <h3>{group.group}</h3>
                        <div className="dev-menu-item-grid">
                            {group.pizzas.map((pizza) => (
                                <article className="dev-menu-item" key={pizza.id}>
                                    <header><h4>{pizza.name}</h4><p>{pizza.description}</p></header>
                                    <div className="dev-menu-item-details">
                                        <div>
                                            <strong>Pre-bake</strong>
                                            <ul>
                                                {pizza.preset.defaultPreBakeIngredientIds.map((id) => {
                                                    const ingredient = MENU.ingredients.find((item) => item.id === id);
                                                    return <li key={id}>{ingredient?.name ?? id}</li>;
                                                })}
                                            </ul>
                                        </div>
                                        {pizza.preset.defaultPostBakeIngredientIds.length > 0 ? (
                                            <div>
                                                <strong>Finish</strong>
                                                <ul>
                                                    {pizza.preset.defaultPostBakeIngredientIds.map((id) => {
                                                        const ingredient = MENU.ingredients.find((item) => item.id === id);
                                                        return <li key={id}>{ingredient?.name ?? id}</li>;
                                                    })}
                                                </ul>
                                            </div>
                                        ) : null}
                                    </div>
                                    <Link href={`/dev/order/${pizza.id}`}>Order This Pizza</Link>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}
            </section>

            <section className="dev-catalog-section dev-potions-section">
                <header className="dev-catalog-section-heading">
                    <span>Arcane refreshments</span>
                    <h2>Signature Potions</h2>
                    <p>Base price: <strong>$3.99</strong></p>
                    <p>Energy add-ins available: <strong>Half can +$1.50</strong>, <strong>Full can +$2.50</strong> — Red Bull or Monster.</p>
                </header>
                <div className="dev-catalog-tile-grid">
                    {MENU.potions.map((potion) => (
                        <article className="dev-catalog-tile" key={potion.id}>
                            <h3>{potion.name}</h3>
                            <p>{potion.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dev-catalog-section">
                <header className="dev-catalog-section-heading"><span>Pair the party</span><h2>Adventure Combos</h2></header>
                <div className="dev-combo-grid">
                    {MENU.combos.map((combo) => {
                        const pizza = MENU.pizzas.find((item) => item.id === combo.pizzaId);
                        return (
                            <article className="dev-combo-item" key={combo.id}>
                                <h3>{combo.name}</h3>
                                <p>Pizza: <strong>{pizza?.name ?? combo.pizzaId}</strong></p>
                                <p>Potion options: {combo.potionOptions.map((id) => MENU.potions.find((item) => item.id === id)?.name ?? id).join(", ")}</p>
                                <Link href={`/dev/order/${combo.pizzaId}`}>Order This Combo&apos;s Pizza</Link>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="dev-catalog-section">
                <header className="dev-catalog-section-heading"><span>Know your components</span><h2>Pizza Build Ingredients</h2></header>
                <div className="dev-ingredient-grid">
                    {ingredientGroups.map(([title, items]) => (
                        <section className="dev-ingredient-column" key={title}>
                            <h3>{title}</h3>
                            <ul>{items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
                        </section>
                    ))}
                </div>
            </section>
        </main>
    );
}
