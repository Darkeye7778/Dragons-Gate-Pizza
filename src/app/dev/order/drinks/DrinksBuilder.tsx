"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MENU } from "@/data/menu";
import { addToCart } from "@/lib/cart/store";
import { formatMoney } from "@/lib/pricing/format";

function itemId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `drink-${Date.now()}`;
}

export default function DrinksBuilder({ requestedType, comboId, comboGroupId }: { requestedType?: "fountain" | "energy"; comboId?: string; comboGroupId?: string }) {
    const router = useRouter();
    const [fountainBaseId, setFountainBaseId] = useState(MENU.drinkBases[0]?.id ?? "");
    const [energyBrandId, setEnergyBrandId] = useState(MENU.energyBrands[0]?.id ?? "");
    const selectedBrand = MENU.energyBrands.find((item) => item.id === energyBrandId);
    const [energyVariantId, setEnergyVariantId] = useState(MENU.energyBrands[0]?.variants[0]?.id ?? "");
    const [quantity, setQuantity] = useState(1);

    const comboFields = comboId ? { comboId, comboType: "byo" as const, comboGroupId } : {};

    function addFountain() {
        addToCart({ kind: "drink", id: itemId(), drinkType: "fountain", baseId: fountainBaseId, quantity, unitBasePrice: 0, pricingState: "tbd", ...comboFields });
        router.push("/dev/cart");
    }

    function addEnergy() {
        addToCart({ kind: "drink", id: itemId(), drinkType: "energy", energyBrandId, energyVariantId, quantity, unitBasePrice: MENU.straightEnergyDrinkPrice, pricingState: "priced", ...comboFields });
        router.push("/dev/cart");
    }

    function chooseBrand(id: string) {
        const brand = MENU.energyBrands.find((item) => item.id === id);
        setEnergyBrandId(id);
        setEnergyVariantId(brand?.variants[0]?.id ?? "");
    }

    return <main className="dev-catalog-page">
        <nav className="dev-order-breadcrumb"><Link href="/dev/order">Order Ahead</Link><span>/</span><span>Standalone Drinks</span></nav>
        <header className="dev-catalog-hero"><span className="dev-section-kicker">No potion required</span><h1>Standalone Drinks</h1><p>Choose a regular fountain drink or a straight energy drink. These remain separate products from Potions.</p></header>
        {comboId ? <p className="dev-data-note">{requestedType === "fountain" ? "Fountain Drink selected" : requestedType === "energy" ? "Straight Energy Drink selected" : "This drink"} for your Build Your Own Adventure Combo. Combo pricing is coming soon.</p> : null}
        <div className="dev-drink-order-grid">
            {requestedType !== "energy" ? <section className="dev-builder-step"><span className="dev-section-kicker">Fountain drink</span><h2>Choose a Base</h2><p>Standalone fountain pricing has not been finalized. You may preserve the selection in this prototype, but no fake price is shown.</p>
                <label className="dev-field-label">Drink base<select value={fountainBaseId} onChange={(event) => setFountainBaseId(event.target.value)}>{MENU.drinkBases.map((base) => <option key={base.id} value={base.id}>{base.name}</option>)}</select></label>
                <strong>Price TBD</strong><button className="dev-add-cart-button" type="button" onClick={addFountain}>Add Fountain Selection</button>
            </section> : null}
            {requestedType !== "fountain" ? <section className="dev-builder-step"><span className="dev-section-kicker">Straight can</span><h2>Energy Drink</h2><p>A sealed Red Bull or Monster can—not a Potion or energy add-in.</p>
                <label className="dev-field-label">Brand<select value={energyBrandId} onChange={(event) => chooseBrand(event.target.value)}>{MENU.energyBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
                <label className="dev-field-label">Variant<select value={energyVariantId} onChange={(event) => setEnergyVariantId(event.target.value)}>{selectedBrand?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select></label>
                <strong>{formatMoney(MENU.straightEnergyDrinkPrice)} each</strong><button className="dev-add-cart-button" type="button" onClick={addEnergy}>Add Energy Drink</button>
            </section> : null}
        </div>
        <div className="dev-quantity-control"><span>Quantity</span><div><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><output>{quantity}</output><button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button></div></div>
    </main>;
}
