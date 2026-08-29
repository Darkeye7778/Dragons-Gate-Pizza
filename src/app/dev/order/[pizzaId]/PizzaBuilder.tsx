"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import { MENU } from "@/data/menu";
import { addToCart } from "@/lib/cart/store";
import { PIZZA_CUT_LABELS, type PizzaCutStyle } from "@/lib/cart/types";
import {
    getCheeseOptions,
    getCrustOptions,
    getFinishOptions,
    getNonCrustIngredients,
    getSauceOptions,
    getSignatureToppingUnits,
    getToppingOptions,
    sortIngredientIds,
} from "@/lib/menu/catalog";
import type { Ingredient, MenuPizza, ToppingAmount, ToppingPlacement } from "@/lib/menu/types";
import { getBasePizzaPrice, multiplyMoney } from "@/lib/pricing/calc";
import { formatMoney } from "@/lib/pricing/format";
import { calculatePizzaPricing } from "@/lib/pricing/pizzaPricing";
import {
    ADDITIONAL_TOPPING_UNIT_PRICE,
    BUILD_YOUR_OWN_TOPPING_CHARGE,
    DEFAULT_PIZZA_SIZE_ID,
    PIZZA_SIZES,
    STANDARD_TOPPING_UNIT_PRICE,
} from "@/lib/pricing/priceTable";
import type { CrustId, PizzaSizeId, PocketDoughId } from "@/lib/pricing/types";

const CRUST_OPTIONS = getCrustOptions();
const INGREDIENTS = getNonCrustIngredients();
const SAUCES = getSauceOptions();
const CHEESES = getCheeseOptions();
const TOPPINGS = getToppingOptions();
const FINISHES = getFinishOptions();
const STANDARD_CUT_OPTIONS: PizzaCutStyle[] = ["six-slice", "eight-slice", "square"];
const POCKET_CUT_OPTIONS: PizzaCutStyle[] = ["uncut", "three-slice"];
const POCKET_DOUGH_OPTIONS: PocketDoughId[] = ["regular", "vegan", "gluten-free"];
const TOPPING_AMOUNTS: ToppingAmount[] = ["light", "normal", "extra", "double", "triple"];

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

function initialFinishPlacements(pizza: MenuPizza | null): Record<string, ToppingPlacement> {
    return Object.fromEntries(
        (pizza?.preset.defaultPostBakeIngredientIds ?? []).map((id) => [id, "whole"]),
    );
}

function initialToppingAmounts(pizza: MenuPizza | null): Record<string, ToppingAmount> {
    const toppingIds = new Set(TOPPINGS.map((item) => item.id));
    return Object.fromEntries(
        (pizza?.preset.defaultPreBakeIngredientIds ?? [])
            .filter((id) => toppingIds.has(id))
            .map((id) => [id, pizza?.preset.defaultToppingAmounts?.[id] ?? "normal"]),
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

function getToppingMarkers(id: string, placement: ToppingPlacement, amount: ToppingAmount = "normal") {
    const seed = ingredientSeed(id);
    const wholeCounts: Record<ToppingAmount, number> = { light: 4, normal: 7, extra: 10, double: 13, triple: 16 };
    const count = placement === "whole" ? wholeCounts[amount] : Math.max(3, Math.ceil(wholeCounts[amount] * 0.68));

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

function IngredientPrice({ children = "Included" }: { children?: React.ReactNode }) {
    return <small className="dev-included-price">{children}</small>;
}

function ChoiceTile({ ingredient, selected, onChange, type = "checkbox", name, priceLabel }: {
    ingredient: Ingredient;
    selected: boolean;
    onChange: () => void;
    type?: "checkbox" | "radio";
    name?: string;
    priceLabel?: React.ReactNode;
}) {
    return (
        <label className="dev-ingredient-tile">
            <input type={type} name={name} checked={selected} onChange={onChange} />
            <span className="dev-choice-mark" aria-hidden="true" />
            <strong>{ingredient.name}</strong>
            <IngredientPrice>{priceLabel}</IngredientPrice>
        </label>
    );
}

export default function PizzaBuilder({ pizza, pairedPotionId, pairedDrinkPath, comboId }: { pizza: MenuPizza | null; pairedPotionId?: string; pairedDrinkPath?: string; comboId?: string }) {
    const router = useRouter();
    const originalPreBake = pizza?.preset.defaultPreBakeIngredientIds ?? [];
    const originalPostBake = pizza?.preset.defaultPostBakeIngredientIds ?? [];
    const originalIngredients = new Set([...originalPreBake, ...originalPostBake]);
    const [sizeId, setSizeId] = useState<PizzaSizeId>(DEFAULT_PIZZA_SIZE_ID);
    const [crustId, setCrustId] = useState<CrustId>("regular");
    const [pocketDoughId, setPocketDoughId] = useState<PocketDoughId>("regular");
    const [preBakeIngredientIds, setPreBakeIngredientIds] = useState<string[]>(originalPreBake);
    const [postBakeIngredientIds, setPostBakeIngredientIds] = useState<string[]>(originalPostBake);
    const [toppingPlacements, setToppingPlacements] = useState<Record<string, ToppingPlacement>>(() => initialPlacements(pizza));
    const [toppingAmounts, setToppingAmounts] = useState<Record<string, ToppingAmount>>(() => initialToppingAmounts(pizza));
    const [finishPlacements, setFinishPlacements] = useState<Record<string, ToppingPlacement>>(() => initialFinishPlacements(pizza));
    const [cutStyle, setCutStyle] = useState<PizzaCutStyle>("eight-slice");
    const [quantity, setQuantity] = useState(1);

    const selectedSize = PIZZA_SIZES.find((size) => size.id === sizeId);
    const isPizzaPocket = crustId === "pizza-pocket";
    const selectedCrust = MENU.ingredients.find((item) => item.id === crustId);
    const selectedPocketDough = MENU.ingredients.find((item) => item.id === pocketDoughId);
    const sauceId = SAUCES.find((item) => preBakeIngredientIds.includes(item.id))?.id ?? "none";
    const selectedCheeses = CHEESES.filter((item) => preBakeIngredientIds.includes(item.id));
    const selectedToppings = TOPPINGS.filter((item) => preBakeIngredientIds.includes(item.id));
    const selectedFinishes = FINISHES.filter((item) => postBakeIngredientIds.includes(item.id));
    const pocketTopCheeses = selectedCheeses.length > 0
        ? selectedCheeses
        : CHEESES.filter((item) => item.id === (pocketDoughId === "vegan" ? "vegan-mozzarella" : "mozzarella"));
    const selectedNonVeganIngredients = INGREDIENTS.filter((item) =>
        (preBakeIngredientIds.includes(item.id) || postBakeIngredientIds.includes(item.id))
        && (item.category === "meat" || item.category === "cheese" || item.allergens?.includes("milk") || item.id === "sweet-hot-honey-drizzle"),
    );
    const toppingSelections = selectedToppings.map((item) => ({
        ingredientId: item.id,
        placement: toppingPlacements[item.id] ?? "whole" as const,
        amount: toppingAmounts[item.id] ?? "normal" as const,
    }));
    const signaturePresetToppingUnits = pizza ? getSignatureToppingUnits(pizza) : undefined;
    const pricing = calculatePizzaPricing({
        sizeId,
        crustId,
        pocketDoughId,
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
        setToppingAmounts((current) => {
            const next = { ...current };
            if (isSelected) delete next[id];
            else next[id] = "normal";
            return next;
        });
    }

    function toggleFinish(id: string) {
        const isSelected = postBakeIngredientIds.includes(id);
        toggleIngredient(id, true);
        setFinishPlacements((current) => {
            const next = { ...current };
            if (isSelected) delete next[id];
            else next[id] = "whole";
            return next;
        });
    }

    function setPlacement(id: string, placement: ToppingPlacement) {
        setToppingPlacements((current) => ({ ...current, [id]: placement }));
    }

    function setAmount(id: string, amount: ToppingAmount) {
        setToppingAmounts((current) => ({ ...current, [id]: amount }));
    }

    function setFinishPlacement(id: string, placement: ToppingPlacement) {
        setFinishPlacements((current) => ({ ...current, [id]: placement }));
    }

    function chooseSize(nextSizeId: PizzaSizeId) {
        setSizeId(nextSizeId);
        if (!isPizzaPocket && nextSizeId !== "kids_9" && cutStyle === "four-slice") {
            setCutStyle("eight-slice");
        }
    }

    function chooseCrust(nextCrustId: CrustId) {
        setCrustId(nextCrustId);
        if (nextCrustId === "pizza-pocket") {
            setCutStyle("uncut");
            setToppingPlacements((current) => Object.fromEntries(Object.keys(current).map((id) => [id, "whole"])));
            setFinishPlacements((current) => Object.fromEntries(Object.keys(current).map((id) => [id, "whole"])));
        } else if (isPizzaPocket) {
            setCutStyle("eight-slice");
        }
    }

    function resetBuild() {
        setSizeId(DEFAULT_PIZZA_SIZE_ID);
        setCrustId("regular");
        setPocketDoughId("regular");
        setPreBakeIngredientIds(originalPreBake);
        setPostBakeIngredientIds(originalPostBake);
        setToppingPlacements(initialPlacements(pizza));
        setToppingAmounts(initialToppingAmounts(pizza));
        setFinishPlacements(initialFinishPlacements(pizza));
        setCutStyle("eight-slice");
        setQuantity(1);
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const comboGroupId = comboId ? createCartItemId() : undefined;
        addToCart({
            kind: "pizza", id: createCartItemId(), pizzaId: pizza?.id ?? "custom", sizeId, crustId,
            pocketDoughId: isPizzaPocket ? pocketDoughId : undefined,
            preBakeIngredientIds,
            postBakeIngredientIds,
            toppingPlacements: isPizzaPocket ? Object.fromEntries(selectedToppings.map((item) => [item.id, "whole"])) : toppingPlacements,
            toppingAmounts,
            finishPlacements: isPizzaPocket ? Object.fromEntries(selectedFinishes.map((item) => [item.id, "whole"])) : finishPlacements,
            cutStyle,
            quantity,
            unitBasePrice: unitPrice, pricing,
            comboId,
            comboType: comboId === "byo-adventure" ? "byo" : comboId ? "curated" : undefined,
            comboGroupId,
        });
        router.push(pairedPotionId
            ? `/dev/order/potion/${pairedPotionId}?combo=${comboId ?? ""}&group=${comboGroupId ?? ""}`
            : pairedDrinkPath
                ? `${pairedDrinkPath}?combo=${comboId ?? ""}&group=${comboGroupId ?? ""}`
                : "/dev/cart");
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
                    : isPizzaPocket
                        ? "Build it in real time. Choose each layer, then watch the filled dough fold into a Pizza Pocket."
                        : "Build it in real time. Choose each layer, decide which half gets every topping, and watch the pizza take shape."}
                </p>
            </header>

            <form className="dev-builder-layout" onSubmit={handleSubmit}>
                <aside className="dev-pizza-workbench" aria-label="Live pizza preview">
                    <div className="dev-preview-heading">
                        <div><span>Live build</span><h2>Your Pizza</h2></div>
                        <div className="dev-preview-status">
                            <strong>{selectedCount === 0 ? "Blank slate" : `${pricing.toppingUnits} TU · ${pricing.tierLabel}`}</strong>
                            <span className="dev-preview-cut">{PIZZA_CUT_LABELS[cutStyle]}</span>
                            {isPizzaPocket
                                ? <div className="dev-pocket-key"><span>Folded pocket</span></div>
                                : <div className="dev-half-key"><span>Left</span><span>Right</span></div>}
                        </div>
                    </div>
                    <div className="dev-pizza-stage">
                        <div className="dev-pizza-disc" data-crust={isPizzaPocket ? pocketDoughId : crustId} data-pocket={isPizzaPocket} style={{ "--pizza-diameter": `${pizzaDiameter}%` } as CSSProperties}>
                            <div className="dev-pizza-sauce" data-sauce={sauceId} />
                            <div className="dev-pizza-cheese" data-cheese={selectedCheeses.length > 0} data-cheese-count={selectedCheeses.length} />
                            <div className="dev-pizza-half-line" aria-hidden="true" />
                            {selectedToppings.flatMap((ingredient) => {
                                const placement = isPizzaPocket ? "whole" : (toppingPlacements[ingredient.id] ?? "whole");
                                const amount = toppingAmounts[ingredient.id] ?? "normal";
                                return getToppingMarkers(ingredient.id, placement, amount).map((marker, markerIndex) => (
                                    <span
                                        className={`dev-pizza-topping topping-${toppingVisualClass(ingredient.id)}`}
                                        key={`${ingredient.id}-${markerIndex}`}
                                        title={`${ingredient.name} · ${amount} · ${placement}`}
                                        style={{
                                            left: `${marker.left}%`, top: `${marker.top}%`,
                                            "--topping-rotation": `${marker.rotation}deg`,
                                            "--topping-scale": marker.scale,
                                            "--topping-delay": `${markerIndex * 24}ms`,
                                        } as CSSProperties}
                                    />
                                ));
                            })}
                            {selectedFinishes.map((finish, index) => {
                                const placement = isPizzaPocket ? "whole" : (finishPlacements[finish.id] ?? "whole");
                                if (finish.category === "post-bake-greens") {
                                    return <span className="dev-pizza-finish-greens" data-placement={placement} key={finish.id} title={`${finish.name} · ${placement}`}>{getToppingMarkers(finish.id, placement, "extra").map((marker, markerIndex) => <i key={markerIndex} style={{ left: `${marker.left}%`, top: `${marker.top}%`, transform: `rotate(${marker.rotation}deg) scale(${marker.scale})` }} />)}</span>;
                                }
                                return <span className={`dev-pizza-drizzle drizzle-${index % 3}`} data-placement={placement} key={finish.id} title={`${finish.name} · ${placement}`} />;
                            })}
                            {isPizzaPocket ? <div className="dev-pocket-fold" title={`Extra ${pocketTopCheeses.map((item) => item.name).join(" + ")} over the folded crust`} /> : null}
                            <div className="dev-pizza-cut-guide" data-cut-style={cutStyle} aria-hidden="true" />
                        </div>
                    </div>

                    <div className="dev-on-pizza" aria-live="polite">
                        <strong>On this pizza</strong>
                        {selectedCount === 0 ? <p>Just dough and crust so far. Start adding layers.</p> : (
                            <div>{INGREDIENTS.filter((item) => preBakeIngredientIds.includes(item.id) || postBakeIngredientIds.includes(item.id)).map((item) => {
                                const placement = isPizzaPocket ? "whole" : (toppingPlacements[item.id] ?? finishPlacements[item.id]);
                                const amount = toppingAmounts[item.id];
                                return <span key={item.id}>{item.name}{amount ? ` · ${amount}` : ""}{isPizzaPocket ? (postBakeIngredientIds.includes(item.id) ? " · over crust" : " · inside") : placement && placement !== "whole" ? ` · ${placement}` : ""}</span>;
                            })}</div>
                        )}
                    </div>
                    {isPizzaPocket ? <div className="dev-pocket-prep" role="status">
                        <strong>Pocket preparation</strong>
                        <p>Fillings are placed on one side and folded closed. Extra {pocketTopCheeses.map((item) => item.name).join(" + ")} goes over the crust; finishes are applied on top.</p>
                    </div> : null}
                    {(isPizzaPocket ? selectedPocketDough?.isVegan : selectedCrust?.isVegan) && selectedNonVeganIngredients.length > 0 ? <div className="dev-dietary-warning" role="status">
                        <strong>Vegan crust, non-vegan build</strong>
                        <p>The crust itself is vegan, but {selectedNonVeganIngredients.map((item) => item.name).join(", ")} {selectedNonVeganIngredients.length === 1 ? "is" : "are"} not.</p>
                    </div> : null}
                    <dl className="dev-live-price">
                        <div><dt>{pricing.mode === "custom" ? "Cheese base" : "Signature recipe"} · {selectedSize?.label} · {isPizzaPocket ? `${selectedPocketDough?.name} dough` : selectedCrust?.name}</dt><dd>{formatMoney(pricing.signatureBasePrice ?? pricing.cheeseBasePrice)}</dd></div>
                        {pricing.pizzaPocketCharge > 0 ? <div><dt>Pizza Pocket fold</dt><dd>+{formatMoney(pricing.pizzaPocketCharge)}</dd></div> : null}
                        <div><dt>Topping units</dt><dd>{pricing.toppingUnits} TU</dd></div>
                        {pricing.mode === "custom" ? <>
                            {pricing.standardToppingCharge > 0 ? <div><dt>{pricing.toppingUnits >= 4 ? `BYO tier · up to five toppings` : `Toppings (${pricing.standardToppingUnits} × ${formatMoney(STANDARD_TOPPING_UNIT_PRICE)})`}</dt><dd>+{formatMoney(pricing.standardToppingCharge)}</dd></div> : null}
                            {pricing.additionalToppingCharge > 0 ? <div><dt>Toppings 6+ ({pricing.additionalToppingUnits} × {formatMoney(ADDITIONAL_TOPPING_UNIT_PRICE)})</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div> : null}
                        </> : pricing.additionalToppingCharge > 0 ? <div><dt>Beyond the house recipe ({pricing.additionalToppingUnits} × {formatMoney(ADDITIONAL_TOPPING_UNIT_PRICE)})</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div> : null}
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
                    <p className="dev-build-note">{pizza
                        ? `The house recipe includes ${signaturePresetToppingUnits} topping unit${signaturePresetToppingUnits === 1 ? "" : "s"}. Remove or exchange toppings without changing the signature price; selections beyond that recipe add ${formatMoney(ADDITIONAL_TOPPING_UNIT_PRICE)} each.`
                        : `The listed size/crust price is the cheese base. One, two, and three toppings add ${formatMoney(STANDARD_TOPPING_UNIT_PRICE)} each; the ${formatMoney(BUILD_YOUR_OWN_TOPPING_CHARGE)} BYO tier includes up to five. Toppings 6+ add ${formatMoney(ADDITIONAL_TOPPING_UNIT_PRICE)} each.`} {isPizzaPocket ? "All fillings share one side before folding; the pocket preparation adds $1.00." : "Whole and half placement currently count the same."}</p>
                </aside>

                <div className="dev-builder-controls">
                    <fieldset className="dev-builder-step">
                        <legend><span>01</span> Size &amp; Crust</legend>
                        <p>Watch the pizza change scale as you choose the foundation.</p>
                        <h3>Pizza size</h3>
                        <div className="dev-choice-grid dev-size-grid">{PIZZA_SIZES.map((size) => {
                            const basePrice = isPizzaPocket ? getBasePizzaPrice(size.id, pocketDoughId) : getBasePizzaPrice(size.id, crustId);
                            const price = basePrice === null ? null : calculatePizzaPricing({ sizeId: size.id, crustId, pocketDoughId, toppings: toppingSelections, signaturePresetToppingUnits }).unitPrice;
                            return <label className="dev-choice-card" key={size.id}>
                                <input type="radio" name="pizza-size" checked={sizeId === size.id} onChange={() => chooseSize(size.id)} />
                                <span className="dev-choice-mark" aria-hidden="true" /><strong>{size.label}</strong><small>{price === null ? "Unavailable" : formatMoney(price)}</small>
                            </label>;
                        })}</div>
                        <h3>Crust style</h3>
                        <div className="dev-choice-grid dev-crust-grid">{CRUST_OPTIONS.map((crust) => {
                            const typedId = crust.id as CrustId;
                            const basePrice = getBasePizzaPrice(sizeId, typedId === "pizza-pocket" ? pocketDoughId : typedId);
                            const price = basePrice === null ? null : calculatePizzaPricing({ sizeId, crustId: typedId, pocketDoughId, toppings: toppingSelections, signaturePresetToppingUnits }).unitPrice;
                            return <label className="dev-choice-card" key={crust.id}>
                                <input type="radio" name="pizza-crust" checked={crustId === crust.id} disabled={price === null} onChange={() => chooseCrust(typedId)} />
                                <span className="dev-choice-mark" aria-hidden="true" /><strong>{crust.name}</strong>
                                <small>{price === null ? "Unavailable" : formatMoney(price)}</small>
                                <small className="dev-dietary-fact">{crust.id === "pizza-pocket" ? "Folded · +$1.00" : crust.isVegan ? "Vegan dough" : crust.id === "gluten-free" ? "Gluten-free dough" : "Butter dough · contains milk"}</small>
                            </label>;
                        })}</div>
                        {isPizzaPocket ? <div className="dev-pocket-dough-panel">
                            <h3>Choose the pocket dough</h3>
                            <p>Pizza Pockets can be made with Regular, Vegan, or Gluten-Free dough. Thin, High-Rise, Keto, and Cauliflower cannot hold the folded shape.</p>
                            <div className="dev-choice-grid dev-pocket-dough-grid">{POCKET_DOUGH_OPTIONS.map((doughId) => {
                                const dough = MENU.ingredients.find((item) => item.id === doughId);
                                const pocketPrice = calculatePizzaPricing({ sizeId, crustId: "pizza-pocket", pocketDoughId: doughId, toppings: toppingSelections, signaturePresetToppingUnits }).unitPrice;
                                return dough ? <label className="dev-choice-card" key={doughId}>
                                    <input type="radio" name="pocket-dough" checked={pocketDoughId === doughId} onChange={() => setPocketDoughId(doughId)} />
                                    <span className="dev-choice-mark" aria-hidden="true" /><strong>{dough.name}</strong><small>{formatMoney(pocketPrice)}</small>
                                </label> : null;
                            })}</div>
                        </div> : null}
                        <p className="dev-crust-method-note">The operating plan calls for in-house crusts. Regular, thin, and high-rise use different weights of the same butter dough and are not vegan. Vegan and gluten-free use separate stretchable doughs; cauliflower and keto are vegan mixes portioned and parbaked by size.</p>
                    </fieldset>

                    <fieldset className="dev-builder-step">
                        <legend><span>02</span> Sauce</legend><p>Choose the layer beneath the cheese. One sauce at a time keeps the preview clear.</p>
                        <div className="dev-ingredient-tile-grid">
                            <label className="dev-ingredient-tile"><input type="radio" name="sauce" checked={sauceId === "none"} onChange={() => replaceSauce(null)} /><span className="dev-choice-mark" aria-hidden="true" /><strong>No Sauce</strong><IngredientPrice /></label>
                            {SAUCES.map((item) => <ChoiceTile key={item.id} ingredient={item} selected={sauceId === item.id} type="radio" name="sauce" onChange={() => replaceSauce(item.id)} priceLabel={originalIngredients.has(item.id) ? "Included in house recipe" : "Included"} />)}
                        </div>
                    </fieldset>

                    <fieldset className="dev-builder-step">
                        <legend><span>03</span> Cheese</legend><p>Choose one, stack a blend, or keep it cheese-free.</p>
                        <div className="dev-ingredient-tile-grid">{CHEESES.map((item) => <ChoiceTile key={item.id} ingredient={item} selected={preBakeIngredientIds.includes(item.id)} onChange={() => toggleIngredient(item.id)} priceLabel={originalIngredients.has(item.id) ? "Included in house recipe" : "Included"} />)}</div>
                    </fieldset>

                    <fieldset className="dev-builder-step dev-toppings-step">
                        <legend><span>04</span> Toppings</legend><p>{isPizzaPocket ? "Choose the fillings for your pocket. Every topping is placed together on the filling side before the crust is folded." : "Select a topping, then choose the whole pizza, left half, or right half."}</p>
                        <div className="dev-topping-list">{TOPPINGS.map((item) => {
                            const selected = preBakeIngredientIds.includes(item.id);
                            const placement = toppingPlacements[item.id] ?? "whole";
                            const amount = toppingAmounts[item.id] ?? "normal";
                            const nextToppingPrice = selected ? 0 : Math.max(0, calculatePizzaPricing({
                                sizeId,
                                crustId,
                                pocketDoughId,
                                toppings: [...toppingSelections, { ingredientId: item.id, placement: "whole", amount: "normal" }],
                                signaturePresetToppingUnits,
                            }).unitPrice - pricing.unitPrice);
                            return <article className={`dev-topping-row${selected ? " is-selected" : ""}`} key={item.id}>
                                <button type="button" className="dev-topping-toggle" aria-pressed={selected} onClick={() => toggleTopping(item.id)}>
                                    <span className={`dev-topping-swatch topping-${toppingVisualClass(item.id)}`} aria-hidden="true" />
                                    <span><strong>{item.name}</strong><IngredientPrice>{selected
                                        ? `${originalIngredients.has(item.id) ? "Included in house recipe · " : "1 TU · "}${amount} · ${isPizzaPocket ? "inside pocket" : placement === "whole" ? "whole" : `${placement} half`}`
                                        : nextToppingPrice > 0
                                            ? `${pricing.mode === "signature" ? "Additional topping" : "Adds 1 TU"} · +${formatMoney(nextToppingPrice)}`
                                            : pricing.mode === "signature"
                                                ? originalIngredients.has(item.id) ? "Included in house recipe" : "Replacement slot included"
                                                : "Included in current tier"}</IngredientPrice></span><span className="dev-topping-add">{selected ? "Remove" : "Add"}</span>
                                </button>
                                {selected && !isPizzaPocket ? <div className="dev-placement-control" role="group" aria-label={`${item.name} placement`}>
                                    {(["whole", "left", "right"] as const).map((option) => <button key={option} type="button" aria-pressed={placement === option} onClick={() => setPlacement(item.id, option)}>
                                        <span className={`dev-placement-icon placement-${option}`} aria-hidden="true" />{option === "whole" ? "Whole" : `${option[0].toUpperCase()}${option.slice(1)} half`}
                                    </button>)}
                                </div> : null}
                                {selected ? <div className="dev-amount-control" role="group" aria-label={`${item.name} amount`}>
                                    {TOPPING_AMOUNTS.map((option) => <button key={option} type="button" aria-pressed={amount === option} onClick={() => setAmount(item.id, option)}>{option[0].toUpperCase()}{option.slice(1)}</button>)}
                                </div> : null}
                            </article>;
                        })}</div>
                    </fieldset>

                    <fieldset className="dev-builder-step">
                        <legend><span>05</span> Post-Bake Finishes</legend><p>{isPizzaPocket ? "Finishes are applied over the top of the folded, cheese-finished crust." : "Choose drizzles, oils, glazes, or fresh greens after the pizza leaves the hearth."}</p>
                        <div className="dev-topping-list">{FINISHES.map((item) => {
                            const selected = postBakeIngredientIds.includes(item.id);
                            const placement = finishPlacements[item.id] ?? "whole";
                            return <article className={`dev-topping-row dev-finish-row${selected ? " is-selected" : ""}`} key={item.id}>
                                <button type="button" className="dev-topping-toggle" aria-pressed={selected} onClick={() => toggleFinish(item.id)}>
                                    <span className={`dev-finish-swatch${item.category === "post-bake-greens" ? " is-greens" : ""}`} aria-hidden="true" />
                                    <span><strong>{item.name}</strong><IngredientPrice>{selected
                                        ? `${originalIngredients.has(item.id) ? "Included in house recipe · " : "Included · "}${isPizzaPocket ? "over folded crust" : placement === "whole" ? "whole" : `${placement} half`}`
                                        : originalIngredients.has(item.id) ? "Included in house recipe" : "Included"}</IngredientPrice></span>
                                    <span className="dev-topping-add">{selected ? "Remove" : "Add"}</span>
                                </button>
                                {selected && !isPizzaPocket ? <div className="dev-placement-control" role="group" aria-label={`${item.name} placement`}>
                                    {(["whole", "left", "right"] as const).map((option) => <button key={option} type="button" aria-pressed={placement === option} onClick={() => setFinishPlacement(item.id, option)}>
                                        <span className={`dev-placement-icon placement-${option}`} aria-hidden="true" />{option === "whole" ? "Whole" : `${option[0].toUpperCase()}${option.slice(1)} half`}
                                    </button>)}
                                </div> : null}
                            </article>;
                        })}</div>
                    </fieldset>

                    <fieldset className="dev-builder-step">
                        <legend><span>06</span> Cut Style</legend><p>{isPizzaPocket ? "Keep the folded pocket whole or have it divided into three easy-to-hold pieces." : "Choose how you want the finished pizza sliced. Kids pizzas can also be cut into four larger slices."}</p>
                        <div className="dev-choice-grid dev-cut-grid">{(isPizzaPocket ? POCKET_CUT_OPTIONS : sizeId === "kids_9" ? ["four-slice", ...STANDARD_CUT_OPTIONS] as PizzaCutStyle[] : STANDARD_CUT_OPTIONS).map((option) => <label className="dev-choice-card" key={option}>
                            <input type="radio" name="pizza-cut" checked={cutStyle === option} onChange={() => setCutStyle(option)} />
                            <span className="dev-choice-mark" aria-hidden="true" /><strong>{PIZZA_CUT_LABELS[option]}</strong>
                            <small>{option === "uncut" ? "One folded pocket" : option === "three-slice" ? "Three pocket pieces" : option === "square" ? "Grid-style pieces" : "Traditional wedges"}</small>
                        </label>)}</div>
                    </fieldset>

                    <section className="dev-builder-review">
                        <span>07 · Review the build</span><h2>Ready for the hearth?</h2>
                        <p>{selectedCount} ingredient selection{selectedCount === 1 ? "" : "s"}, {pricing.toppingUnits} topping unit{pricing.toppingUnits === 1 ? "" : "s"} on the {pricing.tierLabel} path, {isPizzaPocket ? `${selectedPocketDough?.name} Pizza Pocket, ` : ""}{PIZZA_CUT_LABELS[cutStyle].toLowerCase()}, and a current total of <strong>{formatMoney(totalPrice)}</strong>.</p>
                        <button className="dev-add-cart-button" type="submit">{pairedPotionId ? "Add Pizza & Choose Paired Potion" : "Add Finished Pizza to Cart"}</button>
                    </section>
                </div>
            </form>
        </main>
    );
}
