// src/app/dev/menu/page.tsx
import Link from "next/link";
import { MENU } from "@/data/menu";
import { getGroupedPizzas, getNonCrustIngredients, getCrustOptions } from "@/lib/menu/catalog";

export default function DevMenuPage() {
    const groupedPizzas = getGroupedPizzas();
    const crustOptions = getCrustOptions();
    const nonCrustIngredients = getNonCrustIngredients();

    const sauces = nonCrustIngredients.filter((item) => item.buildOrder === 20);
    const cheeses = nonCrustIngredients.filter((item) => item.buildOrder === 30);
    const toppings = nonCrustIngredients.filter(
        (item) => item.buildOrder >= 40 && item.buildOrder < 90,
    );
    const finishes = nonCrustIngredients.filter((item) => item.buildOrder >= 90);

    return (
        <main style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
            <header style={{ marginBottom: 32 }}>
                <h1>Dragon’s Gate Pizza Menu</h1>
                <p>
                    Browse the full menu, explore ingredients, and jump straight into
                    ordering anything you want.
                </p>
            </header>

            <section style={{ marginBottom: 32 }}>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        padding: 16,
                        border: "1px solid #ddd",
                        borderRadius: 10,
                    }}
                >
                    <Link href="/dev/order">Start an Order</Link>
                    <Link href="/dev/cart">View Cart</Link>
                </div>
            </section>

            <section style={{ marginBottom: 40 }}>
                <div
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        padding: 20,
                    }}
                >
                    <h2 style={{ marginTop: 0 }}>Build Your Own Pizza</h2>
                    <p>
                        Choose your size, crust, pre-bake ingredients, and finishes after
                        the bake line.
                    </p>
                    <Link href="/dev/order/custom">Build Your Own</Link>
                </div>
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2>Signature Pizzas</h2>

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

                        <div style={{ display: "grid", gap: 16 }}>
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
                                    <p style={{ marginTop: 0 }}>{pizza.description}</p>

                                    <div style={{ marginTop: 12 }}>
                                        <strong>Pre-bake:</strong>
                                        <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                                            {pizza.preset.defaultPreBakeIngredientIds.map((id) => {
                                                const ingredient = MENU.ingredients.find((item) => item.id === id);
                                                return (
                                                    <li key={id}>{ingredient?.name ?? id}</li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                    {pizza.preset.defaultPostBakeIngredientIds.length > 0 ? (
                                        <div style={{ marginTop: 12 }}>
                                            <strong>Finish:</strong>
                                            <ul style={{ marginTop: 8, paddingLeft: 18 }}>
                                                {pizza.preset.defaultPostBakeIngredientIds.map((id) => {
                                                    const ingredient = MENU.ingredients.find((item) => item.id === id);
                                                    return (
                                                        <li key={id}>{ingredient?.name ?? id}</li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    ) : null}

                                    <div style={{ marginTop: 14 }}>
                                        <Link href={`/dev/order/${pizza.id}`}>Order This Pizza</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2>Signature Potions</h2>
                <p>
                    Base price: <strong>$3.99</strong>
                </p>
                <p>
                    Energy add-ins available: <strong>Half can +$1.50</strong>,{" "}
                    <strong>Full can +$2.50</strong> — Red Bull or Monster.
                </p>

                <div style={{ display: "grid", gap: 14 }}>
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
                            <p style={{ margin: 0 }}>{potion.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2>Adventure Combos</h2>
                <div style={{ display: "grid", gap: 14 }}>
                    {MENU.combos.map((combo) => {
                        const pizza = MENU.pizzas.find((item) => item.id === combo.pizzaId);

                        return (
                            <div
                                key={combo.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 10,
                                    padding: 16,
                                }}
                            >
                                <h3 style={{ marginTop: 0, marginBottom: 8 }}>{combo.name}</h3>
                                <p style={{ marginTop: 0 }}>
                                    Pizza: <strong>{pizza?.name ?? combo.pizzaId}</strong>
                                </p>
                                <p style={{ marginBottom: 12 }}>
                                    Potion options:{" "}
                                    {combo.potionOptions
                                        .map((id) => MENU.potions.find((item) => item.id === id)?.name ?? id)
                                        .join(", ")}
                                </p>

                                <Link href={`/dev/order/${combo.pizzaId}`}>Order This Combo’s Pizza</Link>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section style={{ marginBottom: 40 }}>
                <h2>Pizza Build Ingredients</h2>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: 16,
                    }}
                >
                    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Crusts</h3>
                        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                            {crustOptions.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Sauces</h3>
                        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                            {sauces.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Cheeses</h3>
                        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                            {cheeses.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Toppings</h3>
                        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                            {toppings.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    </div>

                    <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 16 }}>
                        <h3 style={{ marginTop: 0 }}>Finishes</h3>
                        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                            {finishes.map((item) => (
                                <li key={item.id}>{item.name}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
}