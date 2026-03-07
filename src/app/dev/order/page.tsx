// src/app/dev/order/page.tsx
import Link from "next/link";
import { MENU } from "@/data/menu";
import { getGroupedPizzas } from "@/lib/menu/catalog";

export default function DevOrderPage() {
    const groupedPizzas = getGroupedPizzas();

    return (
        <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <header style={{ marginBottom: 32 }}>
                <h1>Start Your Order</h1>
                <p>
                    Pick what you want to buy and jump straight into customization.
                </p>
            </header>

            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 16,
                    marginBottom: 36,
                }}
            >
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        padding: 18,
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>Build Your Own Pizza</h2>
                    <p>
                        Start from scratch with your preferred size, crust, toppings, and finishes.
                    </p>
                    <Link href="/dev/order/custom">Start Build</Link>
                </div>

                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        padding: 18,
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>Signature Pizzas</h2>
                    <p>
                        Start with one of the house builds, then customize it how you want.
                    </p>
                    <Link href="#signature-pizzas">Jump to Signatures</Link>
                </div>

                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        padding: 18,
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>Drinks & Potions</h2>
                    <p>
                        Potions and drink add-ons will plug into cart ordering next.
                    </p>
                    <Link href="/dev/menu">Browse Drinks</Link>
                </div>

                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        padding: 18,
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>View Cart</h2>
                    <p>
                        Already picked some stuff? Go straight to the cart.
                    </p>
                    <Link href="/dev/cart">Open Cart</Link>
                </div>
            </section>

            <section id="signature-pizzas">
                <h2>Order a Signature Pizza</h2>

                {groupedPizzas.map((group) => (
                    <div
                        key={group.group}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 12,
                            padding: 20,
                            marginTop: 20,
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>{group.group}</h3>

                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                                gap: 16,
                            }}
                        >
                            {group.pizzas.map((pizza) => (
                                <div
                                    key={pizza.id}
                                    style={{
                                        border: "1px solid #eee",
                                        borderRadius: 10,
                                        padding: 16,
                                    }}
                                >
                                    <h4 style={{ marginTop: 0, marginBottom: 8 }}>{pizza.name}</h4>
                                    <p>{pizza.description}</p>

                                    <p style={{ marginBottom: 10 }}>
                                        Includes{" "}
                                        <strong>
                                            {pizza.preset.defaultPreBakeIngredientIds.length}
                                        </strong>{" "}
                                        pre-bake ingredients
                                        {pizza.preset.defaultPostBakeIngredientIds.length > 0
                                            ? ` and ${pizza.preset.defaultPostBakeIngredientIds.length} finish item(s)`
                                            : ""}
                                        .
                                    </p>

                                    <Link href={`/dev/order/${pizza.id}`}>Customize & Add</Link>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            <section style={{ marginTop: 36 }}>
                <h2>Signature Potions</h2>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                        gap: 14,
                    }}
                >
                    {MENU.potions.map((potion) => (
                        <div
                            key={potion.id}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 10,
                                padding: 16,
                            }}
                        >
                            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{potion.name}</h3>
                            <p style={{ marginTop: 0 }}>{potion.description}</p>
                            <p style={{ marginBottom: 0 }}>$3.99</p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}