import Link from "next/link";
import { MENU } from "@/data/menu";
import { getCheeseOptions, getCrustOptions, getFinishOptions, getGroupedPizzas, getSauceOptions, getToppingOptions } from "@/lib/menu/catalog";

export default function DevMenuPage() {
    const groupedPizzas = getGroupedPizzas();
    const crustOptions = getCrustOptions();
    const sauces = getSauceOptions();
    const cheeses = getCheeseOptions();
    const toppings = getToppingOptions();
    const finishes = getFinishOptions();
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
                    <p>Choose your size, crust, pre-bake ingredients, and finishes after the bake line. The operating plan calls for every crust to be prepared in-house rather than purchased ready-made.</p>
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
                    <p>Or build your own for <strong>$3.49</strong> with one base, up to two flavors, and up to two shimmers included.</p>
                    <Link href="/dev/order/potion/custom">Build Your Own Potion</Link>
                </header>
                <div className="dev-catalog-tile-grid">
                    {MENU.potions.map((potion) => (
                        <article className="dev-catalog-tile" key={potion.id}>
                            <h3>{potion.name}</h3>
                            <p>{potion.description ?? "Signature recipe"}</p>
                            <p>Shimmer: <strong>{MENU.shimmers.find((item) => item.id === potion.defaultShimmerId)?.name}</strong></p>
                            <Link href={`/dev/order/potion/${potion.id}`}>Order This Potion</Link>
                        </article>
                    ))}
                </div>
            </section>

            <section className="dev-catalog-section dev-drink-workshop">
                <header className="dev-catalog-section-heading"><span>Mix your own magic</span><h2>Potion Workshop</h2><p>Enhancements are $0.50 each. Energy upgrades are available by the half or full can.</p></header>
                <div className="dev-drink-directory">
                    <section><h3>Bases</h3><ul>{MENU.drinkBases.map((item) => <li key={item.id}>{item.name}</li>)}</ul></section>
                    <section><h3>Flavor Infusions</h3><ul>{MENU.potionFlavors.map((item) => <li key={item.id}>{item.name}</li>)}</ul></section>
                    <section><h3>Enhancements · +$0.50 each</h3><ul>{MENU.potionEnhancements.map((item) => <li key={item.id}>{item.name}</li>)}</ul></section>
                    <section><h3>Shimmers · up to two included</h3><ul>{MENU.shimmers.map((item) => <li key={item.id}>{item.name}</li>)}</ul></section>
                    <section><h3>Energy</h3>{MENU.energyBrands.map((brand) => <p key={brand.id}><strong>{brand.name}</strong>: {brand.variants.map((item) => item.name).join(", ")}</p>)}<p>Half can +$1.50 · Full can +$2.50 · Straight can $3.99</p></section>
                </div>
            </section>

            <section className="dev-catalog-section">
                <header className="dev-catalog-section-heading"><span>Pair the party</span><h2>Adventure Combos</h2></header>
                <div className="dev-combo-grid">
                    {MENU.combos.map((combo) => {
                        const potion = MENU.potions.find((item) => item.id === combo.potionId);
                        const shimmer = MENU.shimmers.find((item) => item.id === combo.shimmerId);
                        return (
                            <article className="dev-combo-item" key={combo.id}>
                                <h3>{combo.name}</h3>
                                <p>Pizza: <strong>{combo.pizzaName}</strong></p>
                                <p>Potion: <strong>{potion?.name ?? combo.potionId}</strong> · {shimmer?.name ?? combo.shimmerId} shimmer</p>
                                {combo.pizzaId ? <Link href={`/dev/order/${combo.pizzaId}?pair=${combo.potionId}`}>Build This Pairing</Link> : <p className="dev-data-note">Pairing recorded. Its pizza recipe is not yet present in the current site data.</p>}
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
                            <ul>{items.map((item) => <li key={item.id}>{item.name}{item.isCrustOption ? <small>{item.isVegan ? "Vegan" : item.id === "gluten-free" ? "Gluten-free" : "Contains milk"}</small> : null}</li>)}</ul>
                        </section>
                    ))}
                </div>
            </section>
        </main>
    );
}
