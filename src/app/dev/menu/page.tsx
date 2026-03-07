// src/app/dev/menu/page.tsx
import Link from "next/link";
import { MENU } from "@/data/menu";
import { getGroupedPizzas } from "@/lib/menu/catalog";

export default function DevMenuPage() {
    const groupedPizzas = getGroupedPizzas();

    return (
        <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
            <h1>Dragon’s Gate Pizza Menu</h1>
            <p>
                This is the current dev menu view. It renders from the menu catalog, not
                from placeholder text.
            </p>

            <section style={{ marginTop: 24 }}>
                <h2>Signature Pizzas</h2>

                {groupedPizzas.map((group) => (
                    <div
                        key={group.group}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            padding: 16,
                            marginTop: 16,
                        }}
                    >
                        <h3 style={{ marginTop: 0 }}>{group.group}</h3>

                        <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                            {group.pizzas.map((pizza) => (
                                <li key={pizza.id} style={{ marginBottom: 12 }}>
                                    <strong>{pizza.name}</strong> — {pizza.description}{" "}
                                    <Link href={`/dev/order/${pizza.id}`}>Customize / Order</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </section>

            <section style={{ marginTop: 32 }}>
                <h2>Signature Potions</h2>
                <p>
                    Base price: <strong>$3.99</strong>
                </p>
                <p>
                    Energy add-ins: Half can <strong>+$1.50</strong>, Full can{" "}
                    <strong>+$2.50</strong>
                </p>

                <ul style={{ paddingLeft: 18 }}>
                    {MENU.potions.map((potion) => (
                        <li key={potion.id} style={{ marginBottom: 10 }}>
                            <strong>{potion.name}</strong> — {potion.description}
                        </li>
                    ))}
                </ul>
            </section>

            <section style={{ marginTop: 32 }}>
                <h2>Adventure Combos</h2>
                <ul style={{ paddingLeft: 18 }}>
                    {MENU.combos.map((combo) => (
                        <li key={combo.id} style={{ marginBottom: 10 }}>
                            <strong>{combo.name}</strong>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
}