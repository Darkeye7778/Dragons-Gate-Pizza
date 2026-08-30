"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MENU } from "@/data/menu";
import { addToCart } from "@/lib/cart/store";
import { formatMoney } from "@/lib/pricing/format";
import { SIGNATURE_POTION_PRICE } from "@/lib/pricing/priceTable";

function itemId() {
    return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `drink-${Date.now()}`;
}

export default function DrinksBuilder({ requestedType, comboId, comboGroupId }: { requestedType?: "energy"; comboId?: string; comboGroupId?: string }) {
    const router = useRouter();
    const [energyBrandId, setEnergyBrandId] = useState(MENU.energyBrands[0]?.id ?? "");
    const selectedBrand = MENU.energyBrands.find((item) => item.id === energyBrandId);
    const [energyVariantId, setEnergyVariantId] = useState(MENU.energyBrands[0]?.variants[0]?.id ?? "");
    const [quantity, setQuantity] = useState(1);
    const comboFields = comboId ? { comboId, comboType: "byo" as const, comboGroupId } : {};

    function addEnergy() {
        addToCart({
            kind: "drink",
            id: itemId(),
            drinkType: "energy",
            energyBrandId,
            energyVariantId,
            quantity,
            unitBasePrice: MENU.straightEnergyDrinkPrice,
            pricingState: "priced",
            ...comboFields,
        });
        router.push("/dev/cart");
    }

    function chooseBrand(id: string) {
        const brand = MENU.energyBrands.find((item) => item.id === id);
        setEnergyBrandId(id);
        setEnergyVariantId(brand?.variants[0]?.id ?? "");
    }

    return <main className="dev-catalog-page">
        <nav className="dev-order-breadcrumb"><Link href="/dev/order">Order Ahead</Link><span>/</span><span>Drinks &amp; Potions</span></nav>
        <header className="dev-catalog-hero">
            <span className="dev-section-kicker">Refresh the party</span>
            <h1>Drinks &amp; Potions</h1>
            <p>Start with a regular soda, turn it into a custom Potion with flavor infusions, choose a house recipe, or grab a straight energy drink.</p>
        </header>

        {!requestedType ? <>
            <section className="dev-order-paths" aria-label="Drink and Potion options">
                <article><span>01</span><h2>Regular Soda</h2><p>Choose any fountain base for {formatMoney(MENU.fountainDrinkPrice)}.</p><Link href="/dev/order/potion/custom">Choose a Soda</Link></article>
                <article><span>02</span><h2>Build Your Own Potion</h2><p>Start at {formatMoney(MENU.fountainDrinkPrice)}. Add a flavor to reach {formatMoney(MENU.buildYourOwnPotionPrice)}; the first two flavors are included.</p><Link href="/dev/order/potion/custom">Mix a Potion</Link></article>
                <article><span>03</span><h2>Signature Potions</h2><p>House recipes are {formatMoney(SIGNATURE_POTION_PRICE)} and include every flavor in their canonical build.</p><Link href="#signature-potions">Browse Signatures</Link></article>
                <article><span>04</span><h2>Energy Drinks</h2><p>Choose a straight Red Bull or Monster can for {formatMoney(MENU.straightEnergyDrinkPrice)}.</p><Link href="#energy-drinks">Choose Energy</Link></article>
            </section>

            <section className="dev-catalog-section dev-potions-section" id="signature-potions">
                <header className="dev-catalog-section-heading"><span>House recipes</span><h2>Signature Potions</h2><p>Every canonical flavor in the house recipe is included at {formatMoney(SIGNATURE_POTION_PRICE)}.</p></header>
                <div className="dev-catalog-tile-grid">{MENU.potions.map((potion) => <article className="dev-catalog-tile" key={potion.id}><h3>{potion.name}</h3><p>{potion.description}</p><strong>{formatMoney(potion.basePrice)}</strong><Link href={`/dev/order/potion/${potion.id}`}>Customize &amp; Add</Link></article>)}</div>
            </section>
        </> : <p className="dev-data-note">Straight Energy Drink selected for your Build Your Own Adventure Combo. The finished pizza and drink receive the shared combo discount in the cart.</p>}

        <section className="dev-builder-step" id="energy-drinks">
            <span className="dev-section-kicker">Straight can</span><h2>Energy Drinks</h2><p>A sealed Red Bull or Monster can—not a Potion or energy add-in.</p>
            <div className="dev-energy-options">
                <label><span>Brand</span><select value={energyBrandId} onChange={(event) => chooseBrand(event.target.value)}>{MENU.energyBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
                <label><span>Variant</span><select value={energyVariantId} onChange={(event) => setEnergyVariantId(event.target.value)}>{selectedBrand?.variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name}</option>)}</select></label>
            </div>
            <strong>{formatMoney(MENU.straightEnergyDrinkPrice)} each</strong>
            <div className="dev-quantity-control"><span>Quantity</span><div><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><output>{quantity}</output><button type="button" onClick={() => setQuantity((value) => value + 1)}>+</button></div></div>
            <button className="dev-add-cart-button" type="button" onClick={addEnergy}>Add Energy Drink</button>
        </section>
    </main>;
}
