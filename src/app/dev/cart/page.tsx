"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MENU } from "@/data/menu";
import {
    clearCart as clearStoredCart,
    readCart,
    removeFromCart,
    updateCartItemQuantity,
    writeCart,
} from "@/lib/cart/store";
import { calcCartTotals } from "@/lib/cart/totals";
import { isDrinkCartItem, isPotionCartItem, PIZZA_CUT_LABELS, type CartItem, type DrinkCartItem, type PizzaCartItem, type PotionCartItem } from "@/lib/cart/types";
import { getSignatureToppingUnits, getToppingOptions } from "@/lib/menu/catalog";
import { calculatePizzaPricing, type PizzaPricingSnapshot } from "@/lib/pricing/pizzaPricing";
import { formatMoney } from "@/lib/pricing/format";
import { calculatePotionPricing } from "@/lib/pricing/potionPricing";
import { PIZZA_SIZES } from "@/lib/pricing/priceTable";

const TOPPING_IDS = new Set(getToppingOptions().map((ingredient) => ingredient.id));

function getPizzaName(pizzaId: string): string {
    if (pizzaId === "custom") {
        return "Build Your Own Pizza";
    }

    return MENU.pizzas.find((pizza) => pizza.id === pizzaId)?.name ?? "Custom Pizza";
}

function getIngredientSummary(item: PizzaCartItem): string {
    const ids = item.preBakeIngredientIds;
    if (ids.length === 0) {
        return "No sauce, cheese, or pre-bake toppings selected.";
    }

    const names = ids.map((id) => {
        const name = MENU.ingredients.find((ingredient) => ingredient.id === id)?.name ?? id;
        const placement = item.crustId === "pizza-pocket" ? "whole" : item.toppingPlacements?.[id] ?? item.finishPlacements?.[id];
        const amount = item.toppingAmounts?.[id];

        const details = [amount && amount !== "normal" ? amount : null, placement && placement !== "whole" ? `${placement} half` : null].filter(Boolean);
        return details.length > 0 ? `${name} (${details.join(" · ")})` : name;
    });
    const visibleNames = names.slice(0, 5);
    const remainder = names.length - visibleNames.length;

    return remainder > 0
        ? `${visibleNames.join(", ")} +${remainder} more`
        : visibleNames.join(", ");
}

function getFinishSummary(item: PizzaCartItem): string | null {
    if (item.postBakeIngredientIds.length === 0) return null;

    const finishes = item.postBakeIngredientIds.map((id) => {
        const name = MENU.ingredients.find((ingredient) => ingredient.id === id)?.name ?? id;
        const placement = item.finishPlacements?.[id] ?? "whole";
        return `${name} (${item.crustId === "pizza-pocket" ? "over folded crust" : placement === "whole" ? "whole pizza" : `${placement} half`})`;
    });

    return `Finish: ${finishes.join(", ")}`;
}

function getItemPricing(item: PizzaCartItem): PizzaPricingSnapshot {
    const signature = MENU.pizzas.find((pizza) => pizza.id === item.pizzaId);
    const signaturePresetToppingUnits = signature ? getSignatureToppingUnits(signature) : undefined;
    const toppings = item.preBakeIngredientIds
        .filter((id) => TOPPING_IDS.has(id))
        .map((ingredientId) => ({
            ingredientId,
            placement: item.toppingPlacements?.[ingredientId] ?? "whole" as const,
            amount: item.toppingAmounts?.[ingredientId] ?? "normal" as const,
        }));

    return calculatePizzaPricing({
        sizeId: item.sizeId,
        crustId: item.crustId,
        pocketDoughId: item.pocketDoughId,
        toppings,
        signaturePresetToppingUnits,
    });
}

function repriceCartItem(item: CartItem): CartItem {
    if (isDrinkCartItem(item)) {
        return item.drinkType === "energy"
            ? { ...item, pricingState: "priced" as const, unitBasePrice: MENU.straightEnergyDrinkPrice }
            : { ...item, pricingState: "tbd" as const, unitBasePrice: 0 };
    }
    if (isPotionCartItem(item)) {
        const pricing = calculatePotionPricing(item);
        return { ...item, unitBasePrice: pricing.unitPrice };
    }

    const isPizzaPocket = item.crustId === "pizza-pocket";
    const pocketDoughId = isPizzaPocket && ["regular", "vegan", "gluten-free"].includes(item.pocketDoughId ?? "")
        ? item.pocketDoughId
        : isPizzaPocket ? "regular" : undefined;
    const normalizedItem = { ...item, pocketDoughId };
    const pricing = getItemPricing(normalizedItem);
    const savedFinishPlacements = item.finishPlacements ?? Object.fromEntries(
        item.postBakeIngredientIds.map((id) => [id, "whole" as const]),
    );
    const finishPlacements = isPizzaPocket
        ? Object.fromEntries(item.postBakeIngredientIds.map((id) => [id, "whole" as const]))
        : savedFinishPlacements;
    const toppingPlacements = isPizzaPocket
        ? Object.fromEntries(item.preBakeIngredientIds.filter((id) => TOPPING_IDS.has(id)).map((id) => [id, "whole" as const]))
        : item.toppingPlacements;
    const toppingAmounts = Object.fromEntries(
        item.preBakeIngredientIds.filter((id) => TOPPING_IDS.has(id)).map((id) => [id, item.toppingAmounts?.[id] ?? "normal"]),
    );
    const pocketCut = item.cutStyle === "three-slice" ? "three-slice" : "uncut";
    return {
        ...item,
        pocketDoughId,
        toppingPlacements,
        toppingAmounts,
        finishPlacements,
        cutStyle: isPizzaPocket ? pocketCut : item.cutStyle ?? "eight-slice",
        unitBasePrice: pricing.unitPrice,
        pricing,
    };
}

function getPotionName(item: PotionCartItem): string {
    return item.potionId === "custom"
        ? "Build Your Own Potion"
        : MENU.potions.find((potion) => potion.id === item.potionId)?.name ?? "Signature Potion";
}

function getCartItemName(item: CartItem): string {
    if (isDrinkCartItem(item)) return item.drinkType === "fountain" ? "Fountain Drink" : "Energy Drink";
    return isPotionCartItem(item) ? getPotionName(item) : getPizzaName(item.pizzaId);
}

function getDrinkSummary(item: DrinkCartItem): string {
    if (item.drinkType === "fountain") return MENU.drinkBases.find((base) => base.id === item.baseId)?.name ?? "Fountain base";
    const brand = MENU.energyBrands.find((option) => option.id === item.energyBrandId);
    const variant = brand?.variants.find((option) => option.id === item.energyVariantId);
    return `${brand?.name ?? "Energy drink"}${variant ? ` · ${variant.name}` : ""}`;
}

function getPotionSelectionSummary(item: PotionCartItem): string {
    const parts: string[] = [];
    const base = MENU.drinkBases.find((option) => option.id === item.baseId);
    if (base) parts.push(base.name);
    if (item.flavorIds.length > 0) {
        parts.push(item.flavorIds.map((id) => MENU.potionFlavors.find((option) => option.id === id)?.name ?? id).join(" + "));
    }
    if (item.enhancementIds.length > 0) {
        parts.push(item.enhancementIds.map((id) => MENU.potionEnhancements.find((option) => option.id === id)?.name ?? id).join(", "));
    }
    if (item.shimmerIds.length > 0) {
        parts.push(item.shimmerIds.map((id) => MENU.shimmers.find((option) => option.id === id)?.name ?? id).join(" + "));
    }
    if (item.energyAddInId) {
        const brand = MENU.energyBrands.find((option) => option.id === item.energyBrandId);
        const variant = brand?.variants.find((option) => option.id === item.energyVariantId);
        const amount = MENU.energyAddIns.find((option) => option.id === item.energyAddInId);
        parts.push(`${amount?.name ?? "Energy"} ${brand?.name ?? ""}${variant ? ` · ${variant.name}` : ""}`.trim());
    }
    return parts.join(" · ") || "Signature recipe";
}

export default function DevCartPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [cartReady, setCartReady] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const repricedItems = readCart().map(repriceCartItem);
            writeCart(repricedItems);
            setItems(repricedItems);
            setCartReady(true);
        }, 0);

        return () => window.clearTimeout(timer);
    }, []);

    const totals = calcCartTotals(items);

    function changeQuantity(itemId: string, quantity: number) {
        setItems(updateCartItemQuantity(itemId, quantity));
    }

    function removeItem(itemId: string) {
        setItems(removeFromCart(itemId));
    }

    function clearCart() {
        clearStoredCart();
        setItems([]);
    }

    return (
        <main className="dev-catalog-page dev-cart-page">
            <header className="dev-catalog-hero">
                <span className="dev-section-kicker">Review the party&apos;s order</span>
                <h1>Your Cart</h1>
                <p>Your pizza builds are stored in this browser while you explore the ordering prototype.</p>
            </header>

            {!cartReady ? (
                <div className="dev-cart-empty"><p>Loading your cart…</p></div>
            ) : items.length === 0 ? (
                <section className="dev-cart-empty">
                    <span aria-hidden="true">◇</span>
                    <h2>Your cart is waiting for an adventure.</h2>
                    <p>Start with a house recipe or forge a pizza from scratch.</p>
                    <div>
                        <Link href="/dev/order/custom">Build a Pizza</Link>
                        <Link href="/dev/order">Browse House Recipes</Link>
                    </div>
                </section>
            ) : (
                <div className="dev-cart-layout">
                    <section className="dev-cart-items" aria-label="Cart items">
                        <div className="dev-cart-toolbar">
                            <p>{items.length} build{items.length === 1 ? "" : "s"} in your cart</p>
                            <button type="button" onClick={clearCart}>Clear cart</button>
                        </div>

                        {items.map((item, index) => {
                            if (isDrinkCartItem(item)) {
                                return <article className="dev-cart-item" key={item.id}>
                                    <span className="dev-cart-item-number">{String(index + 1).padStart(2, "0")}</span>
                                    <div className="dev-cart-item-copy"><h2>{item.drinkType === "fountain" ? "Fountain Drink" : "Straight Energy Drink"}</h2>
                                        {item.comboGroupId ? <p className="dev-data-note">Build Your Own Adventure Combo · pricing coming soon</p> : null}
                                        <p>{getDrinkSummary(item)}</p><dl className="dev-cart-price-breakdown"><div><dt>Each drink</dt><dd>{item.pricingState === "tbd" ? "Price TBD" : formatMoney(item.unitBasePrice)}</dd></div></dl><Link href="/dev/order/drinks">Order another drink</Link>
                                    </div>
                                    <div className="dev-cart-item-actions"><strong>{item.pricingState === "tbd" ? "TBD" : formatMoney(item.unitBasePrice * item.quantity)}</strong><div className="dev-quantity-control"><div><button type="button" onClick={() => changeQuantity(item.id, Math.max(1, item.quantity - 1))} disabled={item.quantity === 1}>−</button><output>{item.quantity}</output><button type="button" onClick={() => changeQuantity(item.id, item.quantity + 1)}>+</button></div></div><button className="dev-cart-remove" type="button" onClick={() => removeItem(item.id)}>Remove</button></div>
                                </article>;
                            }
                            if (isPotionCartItem(item)) {
                                const pricing = calculatePotionPricing(item);
                                return (
                                    <article className="dev-cart-item" key={item.id}>
                                        <span className="dev-cart-item-number">{String(index + 1).padStart(2, "0")}</span>
                                        <div className="dev-cart-item-copy">
                                            <h2>{getPotionName(item)}</h2>
                                            {item.comboGroupId ? <p className="dev-data-note">{item.comboType === "curated" ? "Curated Adventure Combo" : "Build Your Own Adventure Combo · pricing coming soon"}</p> : null}
                                            <p>Arcane refreshment</p>
                                            <small>{getPotionSelectionSummary(item)}</small>
                                            <dl className="dev-cart-price-breakdown">
                                                <div><dt>Potion base</dt><dd>{formatMoney(pricing.basePrice)}</dd></div>
                                                {pricing.additionalFlavorCount > 0 ? <div><dt>Additional flavors</dt><dd>{pricing.additionalFlavorCharge === null ? "Price TBD" : `+${formatMoney(pricing.additionalFlavorCharge)}`}</dd></div> : null}
                                                {pricing.enhancementCharge > 0 ? <div><dt>Enhancements</dt><dd>+{formatMoney(pricing.enhancementCharge)}</dd></div> : null}
                                                {pricing.energyCharge > 0 ? <div><dt>Energy upgrade</dt><dd>+{formatMoney(pricing.energyCharge)}</dd></div> : null}
                                                <div><dt>Each potion</dt><dd>{formatMoney(pricing.unitPrice)}</dd></div>
                                            </dl>
                                            <Link href={`/dev/order/potion/${item.potionId}`}>Customize another</Link>
                                        </div>
                                        <div className="dev-cart-item-actions">
                                            <strong>{formatMoney(item.unitBasePrice * item.quantity)}</strong>
                                            <div className="dev-quantity-control"><div>
                                                <button type="button" aria-label={`Decrease quantity for ${getPotionName(item)}`} onClick={() => changeQuantity(item.id, Math.max(1, item.quantity - 1))} disabled={item.quantity === 1}>−</button>
                                                <output aria-live="polite">{item.quantity}</output>
                                                <button type="button" aria-label={`Increase quantity for ${getPotionName(item)}`} onClick={() => changeQuantity(item.id, item.quantity + 1)}>+</button>
                                            </div></div>
                                            <button className="dev-cart-remove" type="button" onClick={() => removeItem(item.id)}>Remove</button>
                                        </div>
                                    </article>
                                );
                            }

                            const size = PIZZA_SIZES.find((option) => option.id === item.sizeId);
                            const crust = MENU.ingredients.find((ingredient) => ingredient.id === item.crustId);
                            const pocketDough = item.crustId === "pizza-pocket"
                                ? MENU.ingredients.find((ingredient) => ingredient.id === (item.pocketDoughId ?? "regular"))
                                : null;
                            const pricing = getItemPricing(item);
                            const finishSummary = getFinishSummary(item);
                            const selectedCheeses = item.preBakeIngredientIds
                                .map((id) => MENU.ingredients.find((ingredient) => ingredient.id === id))
                                .filter((ingredient) => ingredient?.category === "cheese" || ingredient?.category === "vegan-cheese");
                            const pocketTopCheese = selectedCheeses.length > 0
                                ? selectedCheeses.map((ingredient) => ingredient?.name).join(" + ")
                                : item.pocketDoughId === "vegan" ? "Vegan Mozzarella" : "Whole-Milk Mozzarella";
                            return (
                                <article className="dev-cart-item" key={item.id}>
                                    <span className="dev-cart-item-number">{String(index + 1).padStart(2, "0")}</span>
                                    <div className="dev-cart-item-copy">
                                        <h2>{getPizzaName(item.pizzaId)}</h2>
                                        {item.comboGroupId ? <p className="dev-data-note">{item.comboType === "curated" ? "Curated Adventure Combo" : "Build Your Own Adventure Combo · pricing coming soon"}</p> : null}
                                        <p>{size?.label ?? item.sizeId} · {item.crustId === "pizza-pocket" ? `Pizza Pocket · ${pocketDough?.name ?? "Regular"} dough` : `${crust?.name ?? item.crustId} crust`} · {PIZZA_CUT_LABELS[item.cutStyle ?? "eight-slice"]}</p>
                                        <small>{getIngredientSummary(item)}</small>
                                        {item.crustId === "pizza-pocket" ? <small>Preparation: fillings folded into one side · Extra {pocketTopCheese} over the crust</small> : null}
                                        {finishSummary ? <small>{finishSummary}</small> : null}
                                        <dl className="dev-cart-price-breakdown">
                                            <div><dt>{pricing.mode === "custom" ? "Cheese base" : "Signature recipe"}</dt><dd>{formatMoney(pricing.signatureBasePrice ?? pricing.cheeseBasePrice)}</dd></div>
                                            {pricing.pizzaPocketCharge > 0 ? <div><dt>Pizza Pocket fold</dt><dd>+{formatMoney(pricing.pizzaPocketCharge)}</dd></div> : null}
                                            <div><dt>Topping units</dt><dd>{pricing.toppingUnits} TU</dd></div>
                                            <div><dt>Cut</dt><dd>{PIZZA_CUT_LABELS[item.cutStyle ?? "eight-slice"]}</dd></div>
                                            {pricing.mode === "custom" ? <>
                                                {pricing.standardToppingCharge > 0 ? <div><dt>{pricing.toppingUnits >= 4 ? "BYO tier · up to five toppings" : "Toppings"}</dt><dd>+{formatMoney(pricing.standardToppingCharge)}</dd></div> : null}
                                                {pricing.additionalToppingCharge > 0 ? <div><dt>Toppings 6+</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div> : null}
                                            </> : <>
                                                <div><dt>House recipe allowance</dt><dd>{pricing.signatureIncludedToppingUnits} TU included</dd></div>
                                                {pricing.additionalToppingCharge > 0 ? <div><dt>Beyond the house recipe</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div> : null}
                                            </>}
                                            <div><dt>Each pizza</dt><dd>{formatMoney(item.unitBasePrice)}</dd></div>
                                        </dl>
                                        <Link href={`/dev/order/${item.pizzaId}`}>Customize another</Link>
                                    </div>
                                    <div className="dev-cart-item-actions">
                                        <strong>{formatMoney(item.unitBasePrice * item.quantity)}</strong>
                                        <div className="dev-quantity-control">
                                            <div>
                                                <button
                                                    type="button"
                                                    aria-label={`Decrease quantity for ${getCartItemName(item)}`}
                                                    onClick={() => changeQuantity(item.id, Math.max(1, item.quantity - 1))}
                                                    disabled={item.quantity === 1}
                                                >−</button>
                                                <output aria-live="polite">{item.quantity}</output>
                                                <button
                                                    type="button"
                                                    aria-label={`Increase quantity for ${getCartItemName(item)}`}
                                                    onClick={() => changeQuantity(item.id, item.quantity + 1)}
                                                >+</button>
                                            </div>
                                        </div>
                                        <button className="dev-cart-remove" type="button" onClick={() => removeItem(item.id)}>
                                            Remove
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>

                    <aside className="dev-cart-summary">
                        <span className="dev-section-kicker">Order summary</span>
                        <dl>
                            <div><dt>{totals.hasUnresolvedPrice ? "Known-price subtotal" : "Order subtotal"}</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
                            <div><dt>Estimated tax</dt><dd>Calculated later</dd></div>
                        </dl>
                        <div className="dev-cart-total">
                            <span>{totals.hasUnresolvedPrice ? "Known-price total" : "Prototype total"}</span>
                            <strong>{formatMoney(totals.subtotal)}{totals.hasUnresolvedPrice ? " + TBD items" : ""}</strong>
                        </div>
                        <Link className="dev-add-cart-button" href="/dev/checkout">Prototype Checkout</Link>
                        <p>
                            This development build stores selections locally. It does not accept payment or submit an order to a restaurant.
                        </p>
                        <Link href="/dev/order">Add another pizza</Link>
                    </aside>
                </div>
            )}
        </main>
    );
}
