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
import { isPotionCartItem, type CartItem, type PizzaCartItem, type PotionCartItem } from "@/lib/cart/types";
import { getToppingOptions } from "@/lib/menu/catalog";
import { calculatePizzaPricing, type PizzaPricingSnapshot } from "@/lib/pricing/pizzaPricing";
import { calculatePotionPricing } from "@/lib/pricing/potionPricing";
import { PIZZA_SIZES } from "@/lib/pricing/priceTable";

const TOPPING_IDS = new Set(getToppingOptions().map((ingredient) => ingredient.id));

function formatMoney(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value);
}

function getPizzaName(pizzaId: string): string {
    if (pizzaId === "custom") {
        return "Build Your Own Pizza";
    }

    return MENU.pizzas.find((pizza) => pizza.id === pizzaId)?.name ?? "Custom Pizza";
}

function getIngredientSummary(item: PizzaCartItem): string {
    const ids = [...item.preBakeIngredientIds, ...item.postBakeIngredientIds];
    if (ids.length === 0) {
        return "No sauce, cheese, toppings, or finish selected.";
    }

    const names = ids.map((id) => {
        const name = MENU.ingredients.find((ingredient) => ingredient.id === id)?.name ?? id;
        const placement = item.toppingPlacements?.[id];

        return placement && placement !== "whole"
            ? `${name} (${placement} half)`
            : name;
    });
    const visibleNames = names.slice(0, 5);
    const remainder = names.length - visibleNames.length;

    return remainder > 0
        ? `${visibleNames.join(", ")} +${remainder} more`
        : visibleNames.join(", ");
}

function getItemPricing(item: PizzaCartItem): PizzaPricingSnapshot {
    const signature = MENU.pizzas.find((pizza) => pizza.id === item.pizzaId);
    const signaturePresetToppingUnits = signature
        ? signature.preset.defaultPreBakeIngredientIds.filter((id) => TOPPING_IDS.has(id)).length
        : undefined;
    const toppings = item.preBakeIngredientIds
        .filter((id) => TOPPING_IDS.has(id))
        .map((ingredientId) => ({
            ingredientId,
            placement: item.toppingPlacements?.[ingredientId] ?? "whole" as const,
        }));

    return calculatePizzaPricing({
        sizeId: item.sizeId,
        crustId: item.crustId,
        toppings,
        signaturePresetToppingUnits,
    });
}

function repriceCartItem(item: CartItem): CartItem {
    if (isPotionCartItem(item)) {
        const pricing = calculatePotionPricing(item);
        return { ...item, unitBasePrice: pricing.unitPrice };
    }

    const pricing = getItemPricing(item);
    return { ...item, unitBasePrice: pricing.unitPrice, pricing };
}

function getPotionName(item: PotionCartItem): string {
    return item.potionId === "custom"
        ? "Build Your Own Potion"
        : MENU.potions.find((potion) => potion.id === item.potionId)?.name ?? "Signature Potion";
}

function getCartItemName(item: CartItem): string {
    return isPotionCartItem(item) ? getPotionName(item) : getPizzaName(item.pizzaId);
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
                            if (isPotionCartItem(item)) {
                                const pricing = calculatePotionPricing(item);
                                return (
                                    <article className="dev-cart-item" key={item.id}>
                                        <span className="dev-cart-item-number">{String(index + 1).padStart(2, "0")}</span>
                                        <div className="dev-cart-item-copy">
                                            <h2>{getPotionName(item)}</h2>
                                            <p>Arcane refreshment</p>
                                            <small>{getPotionSelectionSummary(item)}</small>
                                            <dl className="dev-cart-price-breakdown">
                                                <div><dt>Potion base</dt><dd>{formatMoney(pricing.basePrice)}</dd></div>
                                                <div><dt>Enhancements</dt><dd>+{formatMoney(pricing.enhancementCharge)}</dd></div>
                                                <div><dt>Energy upgrade</dt><dd>+{formatMoney(pricing.energyCharge)}</dd></div>
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
                            const pricing = getItemPricing(item);
                            return (
                                <article className="dev-cart-item" key={item.id}>
                                    <span className="dev-cart-item-number">{String(index + 1).padStart(2, "0")}</span>
                                    <div className="dev-cart-item-copy">
                                        <h2>{getPizzaName(item.pizzaId)}</h2>
                                        <p>{size?.label ?? item.sizeId} · {crust?.name ?? item.crustId} crust</p>
                                        <small>{getIngredientSummary(item)}</small>
                                        <dl className="dev-cart-price-breakdown">
                                            <div><dt>{pricing.mode === "custom" ? "Cheese base" : "Current signature base"}</dt><dd>{formatMoney(pricing.cheeseBasePrice)}</dd></div>
                                            <div><dt>Topping units</dt><dd>{pricing.toppingUnits} TU</dd></div>
                                            {pricing.mode === "custom" ? <>
                                                <div><dt>{pricing.toppingUnits >= 4 ? "BYO tier · up to five toppings" : "Toppings"}</dt><dd>+{formatMoney(pricing.standardToppingCharge)}</dd></div>
                                                <div><dt>Toppings 6+</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div>
                                            </> : <div><dt>Recipe additions</dt><dd>+{formatMoney(pricing.additionalToppingCharge)}</dd></div>}
                                            <div><dt>Each pizza</dt><dd>{formatMoney(item.unitBasePrice)}</dd></div>
                                        </dl>
                                        {pricing.usesFallbackTierPrice ? <small className="dev-cart-price-note">The final menu does not list standalone signature-pizza prices; this build retains the current development signature price.</small> : null}
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
                            <div><dt>Order subtotal</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
                            <div><dt>Estimated tax</dt><dd>Calculated later</dd></div>
                        </dl>
                        <div className="dev-cart-total">
                            <span>Prototype total</span>
                            <strong>{formatMoney(totals.subtotal)}</strong>
                        </div>
                        <button type="button" disabled>Checkout not live yet</button>
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
