// src/app/dev/order/page.tsx
import Link from "next/link";
import { MENU } from "@/data/menu";

export default function DevOrderPage() {
    return (
        <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
            <h1>Start an Order</h1>
            <p>
                Pick a signature pizza below to start the current dev ordering flow.
            </p>

            <section
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: 16,
                    marginTop: 24,
                }}
            >
                {MENU.pizzas.map((pizza) => (
                    <div
                        key={pizza.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            padding: 16,
                        }}
                    >
                        <h2 style={{ marginTop: 0 }}>{pizza.name}</h2>
                        <p>{pizza.description}</p>
                        <p style={{ opacity: 0.75 }}>{pizza.group}</p>
                        <Link href={`/dev/order/${pizza.id}`}>Customize This Pizza</Link>
                    </div>
                ))}
            </section>
        </main>
    );
}