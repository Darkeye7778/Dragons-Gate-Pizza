import Link from "next/link";
import { MENU } from "@/data/menu";
import { getGroupedPizzas } from "@/lib/menu/catalog";

const orderPaths = [
    ["Build Your Own Pizza", "Start from scratch with your preferred size, crust, toppings, and finishes.", "/dev/order/custom", "Start Build"],
    ["Signature Pizzas", "Start with one of the house builds, then customize it how you want.", "#signature-pizzas", "Jump to Signatures"],
    ["Drinks & Potions", "Potions and drink add-ons will plug into cart ordering next.", "/dev/menu", "Browse Drinks"],
    ["View Cart", "Already picked some stuff? Go straight to the cart.", "/dev/cart", "Open Cart"],
];

export default function DevOrderPage() {
    const groupedPizzas = getGroupedPizzas();

    return (
        <main className="dev-catalog-page dev-order-page">
            <header className="dev-catalog-hero">
                <span className="dev-section-kicker">Choose your path</span>
                <h1>Start Your Order</h1>
                <p>Pick what you want to buy and jump straight into customization.</p>
            </header>

            <section className="dev-order-paths" aria-label="Ordering options">
                {orderPaths.map(([title, description, href, label], index) => (
                    <article key={title}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <h2>{title}</h2>
                        <p>{description}</p>
                        <Link href={href}>{label}</Link>
                    </article>
                ))}
            </section>

            <section className="dev-catalog-section" id="signature-pizzas">
                <header className="dev-catalog-section-heading"><span>House recipes</span><h2>Order a Signature Pizza</h2></header>
                {groupedPizzas.map((group) => (
                    <section className="dev-menu-group" key={group.group}>
                        <h3>{group.group}</h3>
                        <div className="dev-order-pizza-grid">
                            {group.pizzas.map((pizza) => (
                                <article className="dev-order-pizza" key={pizza.id}>
                                    <h4>{pizza.name}</h4>
                                    <p>{pizza.description}</p>
                                    <p>Includes <strong>{pizza.preset.defaultPreBakeIngredientIds.length}</strong> pre-bake ingredients{pizza.preset.defaultPostBakeIngredientIds.length > 0 ? ` and ${pizza.preset.defaultPostBakeIngredientIds.length} finish item(s)` : ""}.</p>
                                    <Link href={`/dev/order/${pizza.id}`}>Customize &amp; Add</Link>
                                </article>
                            ))}
                        </div>
                    </section>
                ))}
            </section>

            <section className="dev-catalog-section dev-potions-section">
                <header className="dev-catalog-section-heading"><span>Arcane refreshments</span><h2>Signature Potions</h2></header>
                <div className="dev-catalog-tile-grid">
                    {MENU.potions.map((potion) => (
                        <article className="dev-catalog-tile" key={potion.id}>
                            <h3>{potion.name}</h3>
                            <p>{potion.description}</p>
                            <strong>$3.99</strong>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
