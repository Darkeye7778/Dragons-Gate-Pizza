"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { MENU } from "@/data/menu";
import { addToCart } from "@/lib/cart/store";
import {
    getCheeseOptions,
    getCrustOptions,
    getFinishOptions,
    getNonCrustIngredients,
    getSauceOptions,
    getToppingOptions,
    sortIngredientIds,
} from "@/lib/menu/catalog";
import type { Ingredient, MenuPizza, ToppingPlacement } from "@/lib/menu/types";
import { getBasePizzaPrice, multiplyMoney } from "@/lib/pricing/calc";
import { calculatePizzaPricing } from "@/lib/pricing/pizzaPricing";
import {
    ADDITIONAL_TOPPING_UNIT_PRICE,
    BUILD_YOUR_OWN_TOPPING_CHARGE,
    DEFAULT_PIZZA_SIZE_ID,
    PIZZA_SIZES,
    STANDARD_TOPPING_UNIT_PRICE,
} from "@/lib/pricing/priceTable";
import type { CrustId, PizzaSizeId } from "@/lib/pricing/types";

const CRUST_OPTIONS = getCrustOptions();
const INGREDIENTS = getNonCrustIngredients();
const SAUCES = getSauceOptions();
const CHEESES = getCheeseOptions();
const TOPPINGS = getToppingOptions();
const FINISHES = getFinishOptions();

function formatMoney(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function createCartItemId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `pizza-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function initialPlacements(pizza: MenuPizza | null): Record<string, ToppingPlacement> {
    const toppingIds = new Set(TOPPINGS.map((item) => item.id));
    return Object.fromEntries(
        (pizza?.preset.defaultPreBakeIngredientIds ?? [])
            .filter((id) => toppingIds.has(id))
            .map((id) => [id, "whole"]),
    );
}

function toppingVisualClass(id: string): string {
    if (id.includes("pepperoni")) return "pepperoni";
    if (id === "salami") return "salami";
    if (id.includes("sausage") || id.includes("chorizo") || id.includes("meatball") || id === "ground-beef") return "sausage";
    if (id.includes("bacon") || id === "pork-belly-cubes" || id === "steak-strips" || id === "prosciutto") return "bacon";
    if (id === "ham" || id === "canadian-bacon") return "ham";
    if (id.includes("chicken")) return "chicken";
    if (id.includes("mushroom")) return "mushroom";
    if (id === "green-olives") return "green-olive";
    if (id.includes("olive")) return "olive";
    if (id.includes("onion")) return "onion";
    if (["spinach", "basil", "parsley", "oregano"].includes(id)) return "leaf";
    if (id === "broccoli") return "broccoli";
    if (["pineapple", "roasted-corn", "sweet-potato-slices"].includes(id)) return "gold";
    if (id === "red-peppers") return "red-pepper";
    if (id === "banana-peppers") return "banana-pepper";
    if (id.includes("pepper") || id.includes("jalapeno")) return "pepper";
    if (id.includes("tomato")) return "tomato";
    if (id.includes("garlic")) return "garlic";
    if (id.includes("artichoke")) return "artichoke";
    if (id === "zucchini") return "zucchini";
    if (id === "eggplant") return "eggplant";
    if (id === "red-cabbage") return "cabbage";
    if (["salt", "cracked-pepper", "chili-flake"].includes(id)) return "seasoning";
    if (id.includes("paste") || id.includes("puree") || id.includes("spread")) return "paste";
    return "vegetable";
}

function ingredientSeed(id: string): number {
    return [...id].reduce((seed, character) => ((seed * 31) + character.charCodeAt(0)) % 997, 17);
}

function getToppingMarkers(id: string, placement: ToppingPlacement) {
    const seed = ingredientSeed(id);
    const count = placement === "whole" ? 7 : 5;

    return Array.from({ length: count }, (_, markerIndex) => {
        const angle = ((seed * 17 + markerIndex * 137.508) % 360) * (Math.PI / 180);
        let left: number;
        let top: number;

        if (placement === "whole") {
            const radius = 11 + ((seed + markerIndex * 19) % 28);
            left = 50 + Math.cos(angle) * radius;
            top = 50 + Math.sin(angle) * radius;
        } else {
            const center = placement === "left" ? 29 : 71;
            const horizontalRadius = 9 + ((seed + markerIndex * 7) % 9);
            const verticalRadius = 16 + ((seed + markerIndex * 13) % 19);
            left = center + Math.cos(angle) * horizontalRadius;
            top = 50 + Math.sin(angle) * verticalRadius;
        }

        return {
            left: Math.max(12, Math.min(88, left)),
            top: Math.max(12, Math.min(88, top)),
            rotation: (seed + markerIndex * 47) % 180,
            scale: 0.76 + ((seed + markerIndex * 11) % 28) / 100,
        };
    });
}

function IngredientPrice({ children = "Included · +$0.00" }: { children?: React.ReactNode }) {
    return <small className="dev-included-price">{children}</small>;
}

function ChoiceTile({ ingredient, selected, onChange, type = "checkbox", name }: {
    ingredient: Ingredient;
    selected: boolean;
    onChange: () => void;
    type?: "checkbox" | "radio";
    name?: string;
}) {
    return (
        <label className="dev-ingredient-tile">
            <input type={type} name={name} checked={selected} onChange={onChange} />
            <span className="dev-choice-mark" aria-hidden="true" />
            <strong>{ingredient.name}</strong>
            <IngredientPrice />
        </label>
    );
}

export default function PizzaBuilder({ pizza, pairedPotionId }: { pizza: MenuPizza | null; pairedPotionId?: string }) {
    const router = useRouter();
    const originalPreBake = pizza?.preset.defaultPreBakeIngredientIds ?? [];
    const originalPostBake = pizza?.preset.defaultPostBakeIngredientIds ?? [];
    const [sizeId, setSizeId] = useState<PizzaSizeId>(DEFAULT_PIZZA_SIZE_ID);
    const [crustId, setCrustId] = useState<CrustId>("regular");
    const [preBakeIngredientIds, setPreBakeIngredientIds] = useState<string[]>(originalPreBake);
    const [postBakeIngredientIds, setPostBakeIngredientIds] = useState<string[]>(originalPostBake);
    const [toppingPlacements, setToppingPlacements] = useState<Record<string, ToppingPlacement>>(() => initialPlacements(pizza));
    const [quantity, setQuantity] = useState(1);

    const selectedSize = PIZZA_SIZES.find((size) => size.id === sizeId);
    const selectedCrust = MENU.ingredients.find((item) => item.id === crustId);
    const sauceId = SAUCES.find((item) => preBakeIngredientIds.includes(item.id))?.id ?? "none";
    const selectedCheeses = CHEESES.filter((item) => preBakeIngredientIds.includes(item.id));
    const selectedToppings = TOPPINGS.filter((item) => preBakeIngredientIds.includes(item.id));
    const selectedFinishes = FINISHES.filter((item) => postBakeIngredientIds.includes(item.id));
    const selectedNonVeganIngredients = INGREDIENTS.filter((item) =>
        (preBakeIngredientIds.includes(item.id) || postBakeIngredientIds.includes(item.id))
        && (item.category === "meat" || item.category === "cheese" || item.allergens?.includes("milk") || item.id === "sweet-hot-honey-drizzle"),
    );
    const toppingSelections = selectedToppings.map((item) => ({
        ingredientId: item.id,
        placement: toppingPlacements[item.id] ?? "whole" as const,
    }));
    const signaturePresetToppingUnits = pizza
        ? originalPreBake.filter((id) => TOPPINGS.some((item) => item.id === id)).length
        : undefined;
    const pricing = calculatePizzaPricing({
        sizeId,
        crustId,
        toppings: toppingSelections,
        signaturePresetToppingUnits,
    });
    const unitPrice = pricing.unitPrice;
    const totalPrice = multiplyMoney(unitPrice, quantity);
    const selectedCount = preBakeIngredientIds.length + postBakeIngredientIds.length;
    const pizzaDiameter = 66 + ((selectedSize?.inches ?? 16) / 25) * 30;

    function replaceSauce(id: string | null) {
        const sauceIds = new Set(SAUCES.map((item) => item.id));
        const next = preBakeIngredientIds.filter((itemId) => !sauceIds.has(itemId));
        setPreBakeIngredientIds(sortIngredientIds(id ? [...next, id] : next));
    }

    function toggleIngredient(id: string, postBake = false) {
        const current = postBake ? postBakeIngredientIds : preBakeIngredientIds;
        const setCurrent = postBake ? setPostBakeIngredientIds : setPreBakeIngredientIds;
        const next = current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id];
        setCurrent(sortIngredientIds(next));
    }

    function toggleTopping(id: string) {
        const isSelected = preBakeIngredientIds.includes(id);
        toggleIngredient(id);
        setToppingPlacements((current) => {
            const next = { ...current };
            if (isSelected) delete next[id];
            else next[id] = "whole";
            return next;
        });
    }

    function setPlacement(id: string, placement: ToppingPlacement) {
        setToppingPlacements((current) => ({ ...current, [id]: placement }));
    }

    function resetBuild() {
        setSizeId(DEFAULT_PIZZA_SIZE_ID);
        setCrustId("regular");
        setPreBakeIngredientIds(originalPreBake);
        setPostBakeIngredientIds(originalPostBake);
        setToppingPlacements(initialPlacements(pizza));
        setQuantity(1);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        addToCart({
            kind: "pizza", id: createCartItemId(), pizzaId: pizza?.id ?? "custom", sizeId, crustId,
            preBakeIngredientIds, postBakeIngredientIds, toppingPlacements, quantity,
            unitBasePrice: unitPrice, pricing,
        });
        router.push(pairedPotionId ? `/dev/order/potion/${pairedPotionId}` : "/dev/cart");
    }

    return (
        <main className="dev-catalog-page dev-builder-page">
            <nav className="dev-order-breadcrumb" aria-label="Order navigation">
                <Link href="/dev/order">Order Ahead</Link><span aria-hidden="true">/</span>
                <span>{pizza?.name ?? "Build Your Own"}</span>
            </nav>
            <header className="dev-builder-hero">
                <span className="dev-section-kicker">Forge your pizza</span>
                <h1>{pizza?.name ?? "Build Your Own Pizza"}</h1>
                <p>{pizza
                    ? `${pizza.description} Start with the house recipe, then make it yours.`
                    : "Build it in real time. Choose each layer, decide which half gets every topping, and watch the pizza take shape."}
                </p>
            </header>

            <form className="dev-builder-layout" onSubmit={handleSubmit}>
                <aside className="dev-pizza-workbench" aria-label="Live pizza preview">
                    <div className="dev-preview-heading">
                        <div><span>Live build</span><h2>Your Pizza</h2></div>
                        <div className="dev-preview-status">
                            <strong>{selectedCount === 0 ? "Blank slate" : `${pricing.toppingUnits} TU · ${pricing.tierLabel}`}</strong>
                            <div className="dev-half-key"><span>Left</span><span>Right</span></div>
                        </div>
                    </div>
                    <div className="dev-pizza-stage">
                        <div className="dev-pizza-disc" data-crust={crustId} style={{ "--pizza-diameter": `${pizzaDiameter}%` } as CSSProperties}>
                            <div className="dev-pizza-sauce" data-sauce={sauceId} />
                            <div className="dev-pizza-cheese" data-cheese={selectedCheeses.length > 0} data-cheese-count={selectedCheeses.length} />
                            <div className="dev-pizza-half-line" aria-hidden="true" />
                            {selectedToppings.flatMap((ingredient) => {
                                const placement = toppingPlacements[ingredient.id] ?? "whole";
                                return getToppingMarkers(ingredient.id, placement).map((marker, markerIndex) => (
                                    <span
                                        className={`dev-pizza-topping topping-${toppingVisualClass(ingredient.id)}`}
                                        key={`${ingredient.id}-${markerIndex}`}
                                        title={`${ingredient.name} · ${placement}`}
                                        style={{
                                            left: `${marker.left}%`, top: `${marker.top}%`,
                                            "--topping-rotation": `${marker.rotation}deg`,
                                            "--topping-scale": marker.scale,
                                            "--topping-delay": `${markerIndex * 24}ms`,
                                        } as CSSProperties}
                                    />
                                ));
                            })}
                            {selectedFinishes.map((finish, index) => <span className={`dev-pizza-drizzle drizzle-${index % 3}`} key={finish.id} title={finish.name} />)}
                        </div>
                    </div>

                    <div className="dev-on-pizza" aria-live="polite">
                        <strong>On this pizza</strong>
                        {selectedCount === 0 ? <p>Just dough and crust so far. Start adding layers.</p> : (
                            <div>{INGREDIENTS.filter((item) => preBakeIngredientIds.includes(item.id) || postBakeIngredientIds.includes(item.id)).map((item) => (
                                <span key={item.id}>{item.name}{toppingPlacements[item.id] && toppingPlacements[item.id] !== "whole" ? ` · ${toppingPlacements[item.id]}` : ""}</span>
                            ))}</div>
                        )}
                    </div>
                    {selectedCrust?.isVegan && selectedNonVeganIngredients.length > 0 ? <div className="dev-dietary-warning" role="status">
                        <strong>Vegan crust, non-vegan build</strong>
                        <p>The crust itself is vegan, but {selectedNonVeganIngredients.map((item) => item.name).join(", ")} {selectedNonVeganIngredients.length === 1 ? "is" : "are"} not.</p>
                    </div> : null}
                    <dl className="dev-live-price">
                        <div><dt>{pricing.mode === "custom" ? "Cheese base" : "Current signature base"} · {selectedSize?.label} · {selectedCrust?.name}</dt><dd>{formatMoney(pricing.cheeseBasePrice)}</dd></div>
                        <div><dt>Topping units</dt><dd>{pricing.toppingUnits} TU</dd></div>
                        {pricing.mode === "custom" ? <>
                            <div><dt>{pricing.toppingUnits >= 4 ? `BYO tier · up to five toppings` : `Toppings (${pricing.standardToppingUnits} × ${formatMoney(STANDARD_TOPPING_UNIT_PRICE)})`}</dt><dd>+{formatMoney(pricing.standardToppingCharge)}</dd></div>
                            <div><dt>Toppings 6+ ({pricing.additionalToppingUnits} × {formatMoney(ADDITIONAL_TOPPING_UNIT_PRICE)})</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div>
                        </> : <div><dt>Recipe additions ({pricing.additionalToppingUnits} × {formatMoney(ADDITIONAL_TOPPING_UNIT_PRICE)})</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div>}
                    </dl>
                    <div className="dev-quantity-control">
                        <span>Quantity</span><div>
                            <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity === 1}>−</button>
                            <output aria-live="polite">{quantity}</output>
                            <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => value + 1)}>+</button>
                        </div>
                    </div>
                    <div className="dev-build-total"><span>Current total</span><strong>{formatMoney(totalPrice)}</strong></div>
                    <button className="dev-add-cart-button" type="submit">{pairedPotionId ? "Add Pizza & Choose Paired Potion" : "Add Finished Pizza to Cart"}</button>
                    <button className="dev-reset-build" type="button" onClick={resetBuild}>{pizza ? "Restore house recipe" : "Clear this build"}</button>
                    <p className="dev-build-note">The listed size/crust price is the cheese base. One, two, and three toppings add {formatMoney(STANDARD_TOPPING_UNIT_PRICE)} each; the {formatMoney(BUILD_YOUR_OWN_TOPPING_CHARGE)} BYO tier includes up to five. Toppings 6+ add {formatMoney(ADDITIONAL_TOPPING_UNIT_PRICE)} each. Whole and half placement currently count the same.</p>
                    {pricing.usesFallbackTierPrice ? <p className="dev-pricing-fallback">The final menu does not list standalone signature-pizza prices, so signature recipes continue using the current development price until that table is supplied.</p> : null}
                </aside>

                <div className="dev-builder-controls">
                    <fieldset className="dev-builder-step">
                        <legend><span>01</span> Size &amp; Crust</legend>
                        <p>Watch the pizza change scale as you choose the foundation.</p>
                        <h3>Pizza size</h3>
                        <div className="dev-choice-grid dev-size-grid">{PIZZA_SIZES.map((size) => {
                            const basePrice = getBasePizzaPrice(size.id, crustId);
                            const price = basePrice === null ? null : calculatePizzaPricing({ sizeId: size.id, crustId, toppings: toppingSelections, signaturePresetToppingUnits }).unitPrice;
                            return <label className="dev-choice-card" key={size.id}>
                                <input type="radio" name="pizza-size" checked={sizeId === size.id} onChange={() => setSizeId(size.id)} />
                                <span className="dev-choice-mark" aria-hidden="true" /><strong>{size.label}</strong><small>{price === null ? "Unavailable" : formatMoney(price)}</small>
                            </label>;
                        })}</div>
                        <h3>Crust style</h3>
                        <div className="dev-choice-grid dev-crust-grid">{CRUST_OPTIONS.map((crust) => {
                            const typedId = crust.id as CrustId;
                            const basePrice = getBasePizzaPrice(sizeId, typedId);
                            const price = basePrice === null ? null : calculatePizzaPricing({ sizeId, crustId: typedId, toppings: toppingSelections, signaturePresetToppingUnits }).unitPrice;
                            return <label className="dev-choice-card" key={crust.id}>
                                <input type="radio" name="pizza-crust" checked={crustId === crust.id} disabled={price === null} onChange={() => setCrustId(typedId)} />
                                <span className="dev-choice-mark" aria-hidden="true" /><strong>{crust.name}</strong>
                                <small>{price === null ? "Unavailable" : formatMoney(price)}</small>
                                <small className="dev-dietary-fact">{crust.isVegan ? "Vegan dough" : crust.id === "gluten-free" ? "Gluten-free dough" : "Butter dough · contains milk"}</small>
                            </label>;
                        })}</div>
                        <p className="dev-crust-method-note">The operating plan calls for in-house crusts. Regular, thin, and high-rise use different weights of the same butter dough and are not vegan. Vegan and gluten-free use separate stretchable doughs; cauliflower and keto are vegan mixes portioned and parbaked by size.</p>
                    </fieldset>

                    <fieldset className="dev-builder-step">
                        <legend><span>02</span> Sauce</legend><p>Choose the layer beneath the cheese. One sauce at a time keeps the preview clear.</p>
                        <div className="dev-ingredient-tile-grid">
                            <label className="dev-ingredient-tile"><input type="radio" name="sauce" checked={sauceId === "none"} onChange={() => replaceSauce(null)} /><span className="dev-choice-mark" aria-hidden="true" /><strong>No Sauce</strong><IngredientPrice /></label>
                            {SAUCES.map((item) => <ChoiceTile key={item.id} ingredient={item} selected={sauceId === item.id} type="radio" name="sauce" onChange={() => replaceSauce(item.id)} />)}
                        </div>
                    </fieldset>

                    <fieldset className="dev-builder-step">
                        <legend><span>03</span> Cheese</legend><p>Choose one, stack a blend, or keep it cheese-free.</p>
                        <div className="dev-ingredient-tile-grid">{CHEESES.map((item) => <ChoiceTile key={item.id} ingredient={item} selected={preBakeIngredientIds.includes(item.id)} onChange={() => toggleIngredient(item.id)} />)}</div>
                    </fieldset>

                    <fieldset className="dev-builder-step dev-toppings-step">
                        <legend><span>04</span> Toppings</legend><p>Select a topping, then choose the whole pizza, left half, or right half.</p>
                        <div className="dev-topping-list">{TOPPINGS.map((item) => {
                            const selected = preBakeIngredientIds.includes(item.id);
                            const placement = toppingPlacements[item.id] ?? "whole";
                            const nextToppingPrice = selected ? 0 : Math.max(0, calculatePizzaPricing({
                                sizeId,
                                crustId,
                                toppings: [...toppingSelections, { ingredientId: item.id, placement: "whole" }],
                                signaturePresetToppingUnits,
                            }).unitPrice - pricing.unitPrice);
                            return <article className={`dev-topping-row${selected ? " is-selected" : ""}`} key={item.id}>
                                <button type="button" className="dev-topping-toggle" aria-pressed={selected} onClick={() => toggleTopping(item.id)}>
                                    <span className={`dev-topping-swatch topping-${toppingVisualClass(item.id)}`} aria-hidden="true" />
                                    <span><strong>{item.name}</strong><IngredientPrice>{selected
                                        ? `1 TU · ${placement === "whole" ? "whole" : `${placement} half`}`
                                        : nextToppingPrice > 0
                                            ? `Adds 1 TU · +${formatMoney(nextToppingPrice)}`
                                            : "Adds 1 TU · recipe included"}</IngredientPrice></span><span className="dev-topping-add">{selected ? "Remove" : "Add"}</span>
                                </button>
                                {selected ? <div className="dev-placement-control" role="group" aria-label={`${item.name} placement`}>
                                    {(["whole", "left", "right"] as const).map((option) => <button key={option} type="button" aria-pressed={placement === option} onClick={() => setPlacement(item.id, option)}>
                                        <span className={`dev-placement-icon placement-${option}`} aria-hidden="true" />{option === "whole" ? "Whole" : `${option[0].toUpperCase()}${option.slice(1)} half`}
                                    </button>)}
                                </div> : null}
                            </article>;
                        })}</div>
                    </fieldset>

                    <fieldset className="dev-builder-step">
                        <legend><span>05</span> Finishing Drizzle</legend><p>Add the final layer after the pizza leaves the hearth.</p>
                        <div className="dev-ingredient-tile-grid">{FINISHES.map((item) => <ChoiceTile key={item.id} ingredient={item} selected={postBakeIngredientIds.includes(item.id)} onChange={() => toggleIngredient(item.id, true)} />)}</div>
                    </fieldset>

                    <section className="dev-builder-review">
                        <span>06 · Review the build</span><h2>Ready for the hearth?</h2>
                        <p>{selectedCount} ingredient selection{selectedCount === 1 ? "" : "s"}, {pricing.toppingUnits} topping unit{pricing.toppingUnits === 1 ? "" : "s"} on the {pricing.tierLabel} path, and a current total of <strong>{formatMoney(totalPrice)}</strong>.</p>
                        <button className="dev-add-cart-button" type="submit">{pairedPotionId ? "Add Pizza & Choose Paired Potion" : "Add Finished Pizza to Cart"}</button>
                    </section>
                </div>
            </form>
        </main>
    );
}
