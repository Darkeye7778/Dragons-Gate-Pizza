import Link from "next/link";
import { MENU } from "@/data/menu";
import { getGroupedPizzas, getSignatureToppingUnits } from "@/lib/menu/catalog";
import { formatMoney } from "@/lib/pricing/format";
import { getSignaturePizzaPrice } from "@/lib/pricing/pizzaPricing";

const orderPaths = [
    ["Build Your Own Pizza", "Start from scratch with your preferred size, crust, toppings, and finishes.", "/dev/order/custom", "Start Build"],
    ["Signature Pizzas", "Start with one of the house builds, then customize it how you want.", "#signature-pizzas", "Jump to Signatures"],
    ["Drinks & Potions", "Choose a regular soda, build or customize a Potion, or grab a straight energy drink.", "/dev/order/drinks", "Explore Drinks"],
    ["Adventure Combos", "Choose a canonical pairing or build your own pizza-and-drink adventure.", "/dev/order/combo", "Explore Combos"],
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
                                    <p><strong>{formatMoney(getSignaturePizzaPrice("personal_12", "regular"))}</strong> · Personal 12&quot; regular</p>
                                    <p>Includes <strong>{getSignatureToppingUnits(pizza)}</strong> topping units in its house recipe.</p>
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
                            {potion.isWorkingName ? <small className="dev-data-note">Working name</small> : null}
                            <p>{potion.description}</p>
                            <strong>{formatMoney(potion.basePrice)}</strong>
                            <Link href={`/dev/order/potion/${potion.id}`}>Customize &amp; Add</Link>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
}
