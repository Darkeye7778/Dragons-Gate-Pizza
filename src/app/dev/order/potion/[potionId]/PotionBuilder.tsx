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

type PotionPalette = { primary: string; secondary: string; glow: string; label: string };

const BASE_PALETTES: Record<string, PotionPalette> = {
    signature: { primary: "#6f4b87", secondary: "#2b183c", glow: "rgba(126, 77, 157, 0.34)", label: "#d2b5e2" },
    cola: { primary: "#6f321d", secondary: "#27100d", glow: "rgba(147, 68, 32, 0.36)", label: "#e5b28f" },
    "diet-cola": { primary: "#503026", secondary: "#1b1110", glow: "rgba(116, 74, 57, 0.3)", label: "#d9b7a8" },
    "lemon-lime": { primary: "#d8ef73", secondary: "#6da83c", glow: "rgba(178, 230, 89, 0.34)", label: "#dcf5a0" },
    "root-beer": { primary: "#713617", secondary: "#231008", glow: "rgba(134, 66, 26, 0.34)", label: "#e1a878" },
    "cream-soda": { primary: "#efb45f", secondary: "#a35a24", glow: "rgba(239, 180, 95, 0.34)", label: "#ffdca9" },
    "mountain-dew": { primary: "#a9e441", secondary: "#3b9b35", glow: "rgba(137, 224, 59, 0.36)", label: "#cfff86" },
    lemonade: { primary: "#fff27a", secondary: "#d5a92b", glow: "rgba(255, 232, 83, 0.34)", label: "#fff3a1" },
};

const FLAVOR_COLORS: Record<string, string> = {
    strawberry: "#ff6680",
    raspberry: "#dd3d76",
    "blue-raspberry": "#45a9ff",
    mango: "#ffae37",
    pineapple: "#ffe05c",
    coconut: "#fff5dc",
    cherry: "#d62946",
    vanilla: "#f7e6be",
    caramel: "#c27635",
    hazelnut: "#9b6945",
    cinnamon: "#ce6338",
    lime: "#98e757",
    "green-apple": "#79db52",
    lavender: "#bb91ee",
};

const SHIMMER_PALETTES: Record<string, PotionPalette> = {
    "electric-blue": { primary: "#3699ff", secondary: "#1858d8", glow: "rgba(54, 153, 255, 0.46)", label: "#8dceff" },
    "copper-brown": { primary: "#b46d3b", secondary: "#65351f", glow: "rgba(180, 109, 59, 0.4)", label: "#e8ae83" },
    "soft-green": { primary: "#8ed7a0", secondary: "#438c5d", glow: "rgba(112, 202, 139, 0.38)", label: "#b7ebc3" },
    "fiery-red": { primary: "#ff543e", secondary: "#a90d19", glow: "rgba(255, 65, 47, 0.46)", label: "#ff9a88" },
    "icy-white": { primary: "#f4fdff", secondary: "#a6d7ec", glow: "rgba(214, 247, 255, 0.44)", label: "#f3fdff" },
    "deep-purple": { primary: "#6f3bad", secondary: "#2f105b", glow: "rgba(120, 59, 183, 0.46)", label: "#c39aef" },
    gold: { primary: "#f4cc52", secondary: "#b06b17", glow: "rgba(244, 196, 60, 0.44)", label: "#ffe28a" },
    "bright-pink": { primary: "#ff62b6", secondary: "#bd176e", glow: "rgba(255, 82, 176, 0.44)", label: "#ffabd6" },
    "toxic-green": { primary: "#78ef3c", secondary: "#26912e", glow: "rgba(102, 240, 55, 0.44)", label: "#b6ff85" },
    amber: { primary: "#f3aa35", secondary: "#a95716", glow: "rgba(244, 161, 43, 0.42)", label: "#ffd185" },
    "void-purple": { primary: "#351052", secondary: "#0e0717", glow: "rgba(75, 25, 111, 0.42)", label: "#a979c2" },
    "sunrise-gold": { primary: "#ffd45d", secondary: "#eb7c2c", glow: "rgba(255, 188, 64, 0.46)", label: "#ffe69a" },
    "stone-copper": { primary: "#a8785c", secondary: "#594335", glow: "rgba(159, 111, 84, 0.38)", label: "#d8b09a" },
    "faelight-lime": { primary: "#c8ff64", secondary: "#6bc238", glow: "rgba(186, 255, 83, 0.44)", label: "#dfff9f" },
    "rift-magenta": { primary: "#e63cff", secondary: "#7c18bd", glow: "rgba(222, 55, 255, 0.46)", label: "#ef9dff" },
    "crystal-cyan": { primary: "#54f1ee", secondary: "#168eaf", glow: "rgba(73, 237, 234, 0.44)", label: "#a8fffc" },
    "lightning-blue": { primary: "#82b5ff", secondary: "#345be1", glow: "rgba(101, 155, 255, 0.46)", label: "#b9d6ff" },
    "ember-orange": { primary: "#ff8a35", secondary: "#bd351a", glow: "rgba(255, 112, 42, 0.46)", label: "#ffc084" },
    "ember-blood": { primary: "#c72a3f", secondary: "#5c091d", glow: "rgba(196, 31, 59, 0.46)", label: "#f58b9b" },
    "arcane-violet": { primary: "#9460ff", secondary: "#4f22b4", glow: "rgba(135, 79, 255, 0.46)", label: "#c8adff" },
    "stardust-silver": { primary: "#d9deea", secondary: "#7d8496", glow: "rgba(210, 218, 235, 0.4)", label: "#f1f4fb" },
    "lunar-pearl-white": { primary: "#fff8ee", secondary: "#c7bfd8", glow: "rgba(245, 238, 255, 0.42)", label: "#fffaf2" },
    "aether-glow-teal": { primary: "#50e0c3", secondary: "#167f83", glow: "rgba(64, 220, 188, 0.44)", label: "#a4f9e8" },
    "prism-shift-rainbow": { primary: "#ff5fd1", secondary: "#54e8ff", glow: "rgba(194, 87, 255, 0.46)", label: "#ffc2ef" },
    "shadowmist-black": { primary: "#34303f", secondary: "#09080d", glow: "rgba(97, 87, 116, 0.36)", label: "#b7adca" },
};

export default function PotionBuilder({ potion }: { potion: Potion | null }) {
    const router = useRouter();
    const [baseId, setBaseId] = useState(potion?.defaultBaseId ?? (potion ? "" : MENU.drinkBases[0]?.id ?? ""));
    const [flavorIds, setFlavorIds] = useState<string[]>(potion?.defaultFlavorIds ?? []);
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
    const potionPalette = useMemo(() => BASE_PALETTES[baseId || "signature"] ?? BASE_PALETTES.signature, [baseId]);
    const shimmerLabelColor = SHIMMER_PALETTES[shimmerIds[0]]?.label ?? potionPalette.label;

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
            baseId: baseId || undefined,
            flavorIds,
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
                <aside className="dev-potion-preview" style={{
                    "--potion-primary": potionPalette.primary,
                    "--potion-secondary": potionPalette.secondary,
                    "--potion-glow": potionPalette.glow,
                    "--potion-label": shimmerLabelColor,
                } as CSSProperties}>
                    <div className="dev-preview-heading"><div><span>Live mix</span><h2>Your Potion</h2></div></div>
                    <div className="dev-potion-vessel" aria-hidden="true">
                        <div className="dev-potion-bottle" data-base={baseId || "signature"}>
                            <div className="dev-potion-liquid">
                                <div className="dev-potion-base" />
                                {flavorIds.map((id, index) => <span
                                    className={`dev-flavor-swirl dev-flavor-swirl-${index + 1}`}
                                    key={id}
                                    style={{ "--flavor-color": FLAVOR_COLORS[id] ?? "#ffffff" } as CSSProperties}
                                />)}
                                {shimmerIds.map((id, index) => <span
                                    className={`dev-shimmer-wash dev-shimmer-wash-${index + 1}`}
                                    key={id}
                                    style={{ "--shimmer-layer": SHIMMER_PALETTES[id]?.primary ?? "transparent" } as CSSProperties}
                                />)}
                                <span className="dev-potion-glass-shine" />
                                <span className="dev-potion-bubble dev-potion-bubble-1" />
                                <span className="dev-potion-bubble dev-potion-bubble-2" />
                                <span className="dev-potion-bubble dev-potion-bubble-3" />
                            </div>
                        </div>
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
                        <div className="dev-ingredient-tile-grid dev-shimmer-grid">{MENU.shimmers.map((option) => <label className="dev-ingredient-tile dev-shimmer-option" key={option.id} style={{ "--shimmer-color": SHIMMER_PALETTES[option.id]?.primary } as CSSProperties}>
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
