"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type CSSProperties } from "react";
import { MENU } from "@/data/menu";
import { addToCart } from "@/lib/cart/store";
import type { Potion } from "@/lib/menu/types";
import { multiplyMoney } from "@/lib/pricing/calc";
import { calculatePotionPricing } from "@/lib/pricing/potionPricing";

function formatMoney(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function createCartItemId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `potion-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toggleLimited(current: string[], id: string, limit: number): string[] {
    if (current.includes(id)) return current.filter((item) => item !== id);
    return current.length < limit ? [...current, id] : current;
}

export default function PotionBuilder({ potion }: { potion: Potion | null }) {
    const router = useRouter();
    const [baseId, setBaseId] = useState(potion ? "" : MENU.drinkBases[0]?.id ?? "");
    const [flavorIds, setFlavorIds] = useState<string[]>([]);
    const [enhancementIds, setEnhancementIds] = useState<string[]>([]);
    const [shimmerIds, setShimmerIds] = useState<string[]>(potion ? [potion.defaultShimmerId] : []);
    const [energyAddInId, setEnergyAddInId] = useState("");
    const [energyBrandId, setEnergyBrandId] = useState("");
    const [energyVariantId, setEnergyVariantId] = useState("");
    const [quantity, setQuantity] = useState(1);

    const pricing = calculatePotionPricing({
        potionId: potion?.id ?? "custom",
        enhancementIds,
        energyAddInId: energyAddInId || undefined,
    });
    const totalPrice = multiplyMoney(pricing.unitPrice, quantity);
    const energyBrand = MENU.energyBrands.find((brand) => brand.id === energyBrandId);
    const currentShimmer = MENU.shimmers.find((item) => item.id === shimmerIds[0]);
    const shimmerHue = useMemo(() => {
        const source = currentShimmer?.id ?? "arcane-violet";
        let hash = 0;
        for (const character of source) hash = (hash * 31 + character.charCodeAt(0)) % 360;
        return hash;
    }, [currentShimmer]);

    function toggleEnhancement(id: string) {
        setEnhancementIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    }

    function setEnergyAmount(id: string) {
        setEnergyAddInId(id);
        if (!id) {
            setEnergyBrandId("");
            setEnergyVariantId("");
        } else if (!energyBrandId) {
            const brand = MENU.energyBrands[0];
            setEnergyBrandId(brand?.id ?? "");
            setEnergyVariantId(brand?.variants[0]?.id ?? "");
        }
    }

    function setEnergyBrand(id: string) {
        const brand = MENU.energyBrands.find((item) => item.id === id);
        setEnergyBrandId(id);
        setEnergyVariantId(brand?.variants[0]?.id ?? "");
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!potion && !baseId) return;

        addToCart({
            kind: "potion",
            id: createCartItemId(),
            potionId: potion?.id ?? "custom",
            baseId: potion ? undefined : baseId,
            flavorIds: potion ? [] : flavorIds,
            enhancementIds,
            shimmerIds,
            energyAddInId: energyAddInId || undefined,
            energyBrandId: energyAddInId ? energyBrandId || undefined : undefined,
            energyVariantId: energyAddInId ? energyVariantId || undefined : undefined,
            quantity,
            unitBasePrice: pricing.unitPrice,
        });
        router.push("/dev/cart");
    }

    return (
        <main className="dev-catalog-page dev-potion-builder-page">
            <nav className="dev-order-breadcrumb" aria-label="Order navigation">
                <Link href="/dev/order">Order Ahead</Link><span aria-hidden="true">/</span>
                <span>{potion?.name ?? "Build Your Own Potion"}</span>
            </nav>
            <header className="dev-builder-hero">
                <span className="dev-section-kicker">Mix an arcane refreshment</span>
                <h1>{potion?.name ?? "Build Your Own Potion"}</h1>
                <p>{potion?.description ?? "Choose a soda or lemonade base, add up to two flavors and two shimmers, then finish it with optional enhancements or an energy upgrade."}</p>
            </header>

            <form className="dev-potion-builder-layout" onSubmit={handleSubmit}>
                <aside className="dev-potion-preview" style={{ "--potion-hue": shimmerHue } as CSSProperties}>
                    <div className="dev-preview-heading"><div><span>Live mix</span><h2>Your Potion</h2></div></div>
                    <div className="dev-potion-vessel" aria-hidden="true">
                        <div className="dev-potion-liquid"><span /><span /><span /></div>
                    </div>
                    <div className="dev-potion-summary" aria-live="polite">
                        <strong>{potion?.name ?? MENU.drinkBases.find((item) => item.id === baseId)?.name}</strong>
                        <p>{potion?.description ?? (flavorIds.length ? flavorIds.map((id) => MENU.potionFlavors.find((item) => item.id === id)?.name).join(" + ") : "No flavor infusions selected")}</p>
                        <small>{shimmerIds.length ? `${shimmerIds.map((id) => MENU.shimmers.find((item) => item.id === id)?.name).join(" + ")} shimmer` : "No shimmer selected"}</small>
                    </div>
                    <dl className="dev-live-price">
                        <div><dt>{potion ? "Signature potion" : "Build-your-own base"}</dt><dd>{formatMoney(pricing.basePrice)}</dd></div>
                        <div><dt>Enhancements</dt><dd>+{formatMoney(pricing.enhancementCharge)}</dd></div>
                        <div><dt>Energy upgrade</dt><dd>+{formatMoney(pricing.energyCharge)}</dd></div>
                    </dl>
                    <div className="dev-quantity-control"><span>Quantity</span><div>
                        <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity === 1}>−</button>
                        <output aria-live="polite">{quantity}</output>
                        <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}>+</button>
                    </div></div>
                    <div className="dev-build-total"><span>Current total</span><strong>{formatMoney(totalPrice)}</strong></div>
                    <button className="dev-add-cart-button" type="submit">Add Potion to Cart</button>
                </aside>

                <div className="dev-builder-controls">
                    {potion ? (
                        <section className="dev-builder-step dev-signature-potion-note">
                            <span className="dev-section-kicker">House recipe</span>
                            <h2>{potion.name}</h2>
                            <p>{potion.description ?? "This signature pairing is recorded in the final menu. Its full recipe will be published once the ingredient specification is added to the site data."}</p>
                        </section>
                    ) : (
                        <>
                            <fieldset className="dev-builder-step"><legend><span>01</span> Choose a Base</legend><p>Every build starts with one fountain base.</p>
                                <div className="dev-choice-grid dev-potion-choice-grid">{MENU.drinkBases.map((option) => <label className="dev-choice-card" key={option.id}>
                                    <input type="radio" name="potion-base" checked={baseId === option.id} onChange={() => setBaseId(option.id)} /><span className="dev-choice-mark" aria-hidden="true" /><strong>{option.name}</strong><small>Included</small>
                                </label>)}</div>
                            </fieldset>
                            <fieldset className="dev-builder-step"><legend><span>02</span> Flavor Infusions</legend><p>Choose up to two flavors. Both are included in the build-your-own price.</p>
                                <div className="dev-ingredient-tile-grid">{MENU.potionFlavors.map((option) => <label className="dev-ingredient-tile" key={option.id}>
                                    <input type="checkbox" checked={flavorIds.includes(option.id)} disabled={!flavorIds.includes(option.id) && flavorIds.length >= 2} onChange={() => setFlavorIds((current) => toggleLimited(current, option.id, 2))} /><span className="dev-choice-mark" aria-hidden="true" /><strong>{option.name}</strong><small>Included</small>
                                </label>)}</div>
                            </fieldset>
                        </>
                    )}

                    <fieldset className="dev-builder-step"><legend><span>{potion ? "01" : "03"}</span> Shimmer</legend><p>Choose up to two shimmer colors. Signature potions start with their paired shimmer.</p>
                        <div className="dev-ingredient-tile-grid dev-shimmer-grid">{MENU.shimmers.map((option) => <label className="dev-ingredient-tile" key={option.id}>
                            <input type="checkbox" checked={shimmerIds.includes(option.id)} disabled={!shimmerIds.includes(option.id) && shimmerIds.length >= 2} onChange={() => setShimmerIds((current) => toggleLimited(current, option.id, 2))} /><span className="dev-choice-mark" aria-hidden="true" /><strong>{option.name}</strong><small>Included</small>
                        </label>)}</div>
                    </fieldset>

                    <fieldset className="dev-builder-step"><legend><span>{potion ? "02" : "04"}</span> Enhancements</legend><p>Creams, whipped cream, and fresh fruit pieces are each {formatMoney(0.5)}.</p>
                        <div className="dev-ingredient-tile-grid">{MENU.potionEnhancements.map((option) => <label className="dev-ingredient-tile" key={option.id}>
                            <input type="checkbox" checked={enhancementIds.includes(option.id)} onChange={() => toggleEnhancement(option.id)} /><span className="dev-choice-mark" aria-hidden="true" /><strong>{option.name}</strong><small>+{formatMoney(option.priceDelta)}{option.isVegan ? " · Vegan" : option.allergens?.includes("milk") ? " · Contains milk" : ""}</small>
                        </label>)}</div>
                    </fieldset>

                    <fieldset className="dev-builder-step"><legend><span>{potion ? "03" : "05"}</span> Energy Upgrade</legend><p>Add half or a full can, then choose the brand and variety. A straight energy drink is also listed on the menu for {formatMoney(MENU.straightEnergyDrinkPrice)}.</p>
                        <div className="dev-choice-grid dev-energy-amount-grid">
                            <label className="dev-choice-card"><input type="radio" name="energy-amount" checked={!energyAddInId} onChange={() => setEnergyAmount("")} /><span className="dev-choice-mark" aria-hidden="true" /><strong>No Energy Add-In</strong><small>+$0.00</small></label>
                            {MENU.energyAddIns.map((option) => <label className="dev-choice-card" key={option.id}><input type="radio" name="energy-amount" checked={energyAddInId === option.id} onChange={() => setEnergyAmount(option.id)} /><span className="dev-choice-mark" aria-hidden="true" /><strong>{option.name}</strong><small>+{formatMoney(option.priceDelta)}</small></label>)}
                        </div>
                        {energyAddInId ? <div className="dev-energy-options">
                            <label><span>Brand</span><select value={energyBrandId} onChange={(event) => setEnergyBrand(event.target.value)}>{MENU.energyBrands.map((brand) => <option value={brand.id} key={brand.id}>{brand.name}</option>)}</select></label>
                            <label><span>Variety</span><select value={energyVariantId} onChange={(event) => setEnergyVariantId(event.target.value)}>{energyBrand?.variants.map((variant) => <option value={variant.id} key={variant.id}>{variant.name}</option>)}</select></label>
                        </div> : null}
                    </fieldset>

                    <section className="dev-builder-review"><span>Review the mix</span><h2>Ready to serve?</h2><p>Your current potion total is <strong>{formatMoney(totalPrice)}</strong>.</p><button className="dev-add-cart-button" type="submit">Add Potion to Cart</button></section>
                </div>
            </form>
        </main>
    );
}
