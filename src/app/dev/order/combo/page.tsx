"use client";

import Link from "next/link";
import { useState } from "react";
import { MENU } from "@/data/menu";
import { ADVENTURE_COMBO_DISCOUNT } from "@/lib/pricing/priceTable";
import { formatMoney } from "@/lib/pricing/format";

export default function ComboOrderPage() {
    const [pizzaId, setPizzaId] = useState("custom");
    const [drinkChoice, setDrinkChoice] = useState("potion:custom");
    const isPotion = drinkChoice.startsWith("potion:");
    const standaloneDrinkType = drinkChoice === "standalone:fountain" ? "fountain" : "energy";
    const nextUrl = isPotion
        ? `/dev/order/${pizzaId}?pair=${drinkChoice.slice(7)}&combo=byo-adventure`
        : `/dev/order/${pizzaId}?drink=${standaloneDrinkType}&combo=byo-adventure`;

    return <main className="dev-catalog-page">
        <header className="dev-catalog-hero"><span className="dev-section-kicker">Pair the party</span><h1>Adventure Combos</h1><p>Twelve curated signature pairings plus one freely configurable pizza-and-drink path.</p></header>
        <section className="dev-catalog-section"><header className="dev-catalog-section-heading"><span>Canonical pairings</span><h2>12 Curated Adventures</h2></header>
            <div className="dev-combo-grid">{MENU.combos.map((combo) => {
                const pizza = MENU.pizzas.find((item) => item.id === combo.pizzaId);
                const potion = MENU.potions.find((item) => item.id === combo.potionId);
                return <article className="dev-combo-item" key={combo.id}><h3>{combo.name}</h3><p>{pizza?.name} + {potion?.name}</p><p>{combo.shimmerIds.map((id) => MENU.shimmers.find((item) => item.id === id)?.name ?? id).join(" + ")} shimmer</p><Link href={`/dev/order/${combo.pizzaId}?pair=${combo.potionId}&combo=${combo.id}`}>Build This Pairing</Link></article>;
            })}</div>
        </section>
        <section className="dev-builder-step"><span className="dev-section-kicker">Any pizza + any drink</span><h2>Build Your Own Adventure Combo</h2><p>Choose both products here, then customize the real pizza and drink builders in sequence. The final pizza and drink prices receive one {formatMoney(ADVENTURE_COMBO_DISCOUNT)} Adventure Combo discount.</p>
            <div className="dev-energy-options">
                <label><span>Pizza</span><select value={pizzaId} onChange={(event) => setPizzaId(event.target.value)}><option value="custom">Build Your Own Pizza</option>{MENU.pizzas.map((pizza) => <option key={pizza.id} value={pizza.id}>{pizza.name}</option>)}</select></label>
                <label><span>Drink</span><select value={drinkChoice} onChange={(event) => setDrinkChoice(event.target.value)}><option value="standalone:fountain">Regular Soda</option><option value="potion:custom">Build Your Own Potion</option>{MENU.potions.map((potion) => <option key={potion.id} value={`potion:${potion.id}`}>{potion.name}</option>)}<option value="standalone:energy">Straight Energy Drink</option></select></label>
            </div>
            <p className="dev-data-note">Every combo is priced from the products you actually build, then discounted {formatMoney(ADVENTURE_COMBO_DISCOUNT)}.</p><Link className="dev-add-cart-button" href={nextUrl}>Customize This Pair</Link>
        </section>
    </main>;
}
