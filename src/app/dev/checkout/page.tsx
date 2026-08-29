"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MENU } from "@/data/menu";
import { clearCart, readCart } from "@/lib/cart/store";
import { calcCartTotals } from "@/lib/cart/totals";
import { isDrinkCartItem, isPotionCartItem, PIZZA_CUT_LABELS, type CartItem } from "@/lib/cart/types";
import { formatMoney } from "@/lib/pricing/format";
import { calculatePotionPricing } from "@/lib/pricing/potionPricing";
import { PIZZA_SIZES } from "@/lib/pricing/priceTable";
import { checkoutFormSchema } from "@/lib/validation/checkout";

type Step = "fulfillment" | "customer" | "review" | "confirmation";

function ingredientName(id: string) { return MENU.ingredients.find((item) => item.id === id)?.name ?? id; }
function comboLabel(item: CartItem) {
    if (!item.comboGroupId) return null;
    if (item.comboType === "byo") return "Build Your Own Adventure Combo · pricing coming soon";
    return MENU.combos.find((combo) => combo.id === item.comboId)?.name ?? "Curated Adventure Combo";
}

export default function CheckoutPage() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [ready, setReady] = useState(false);
    const [step, setStep] = useState<Step>("fulfillment");
    const [fulfillmentType, setFulfillmentType] = useState<"pickup" | "delivery" | "dine_in">("pickup");
    const [customer, setCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "" });
    const [address, setAddress] = useState({ addressLine1: "", addressLine2: "", city: "", state: "", postalCode: "" });
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    useEffect(() => { const timer = window.setTimeout(() => { setItems(readCart()); setReady(true); }, 0); return () => clearTimeout(timer); }, []);
    const totals = calcCartTotals(items);

    function proceedToReview() {
        const result = checkoutFormSchema.safeParse({ fulfillmentType, customer, address: fulfillmentType === "delivery" ? address : undefined, notes, items });
        if (!result.success) { setError(result.error.issues[0]?.message ?? "Please check the form."); return; }
        setError(""); setStep("review");
    }

    function placePrototypeOrder() {
        clearCart();
        setStep("confirmation");
    }

    if (!ready) return <main className="dev-catalog-page"><p>Loading checkout…</p></main>;
    if (step === "confirmation") return <main className="dev-catalog-page"><section className="dev-checkout-confirmation"><span className="dev-section-kicker">Prototype complete</span><h1>Your test order has been assembled.</h1><p><strong>Prototype order only.</strong> No restaurant order was transmitted and no payment was collected.</p><Link href="/dev/order">Return to Order Ahead</Link></section></main>;
    if (items.length === 0) return <main className="dev-catalog-page"><section className="dev-cart-empty"><h1>Your cart is empty.</h1><Link href="/dev/order">Start an order</Link></section></main>;

    return <main className="dev-catalog-page dev-checkout-page">
        <header className="dev-catalog-hero"><span className="dev-section-kicker">Non-payment prototype</span><h1>Checkout</h1><p>Choose fulfillment, provide customer details, and review the exact stored builds. Nothing is transmitted.</p></header>
        <nav className="dev-checkout-steps" aria-label="Checkout progress"><span data-active={step === "fulfillment"}>1 Fulfillment</span><span data-active={step === "customer"}>2 Details</span><span data-active={step === "review"}>3 Review</span></nav>

        {step === "fulfillment" ? <section className="dev-builder-step"><h2>How should this prototype order be fulfilled?</h2><div className="dev-choice-grid">{(["pickup", "dine_in", "delivery"] as const).map((type) => <label className="dev-choice-card" key={type}><input type="radio" checked={fulfillmentType === type} onChange={() => setFulfillmentType(type)} /><span className="dev-choice-mark"/><strong>{type === "dine_in" ? "Dine In" : type[0].toUpperCase() + type.slice(1)}</strong><small>Prototype option</small></label>)}</div>{fulfillmentType === "delivery" ? <p className="dev-data-note">Delivery radius, fees, timing, and service areas are not configured.</p> : null}<button className="dev-add-cart-button" type="button" onClick={() => setStep("customer")}>Continue to Customer Details</button></section> : null}

        {step === "customer" ? <section className="dev-builder-step"><h2>Customer Details</h2><div className="dev-checkout-fields">{Object.entries(customer).map(([key, value]) => <label className="dev-field-label" key={key}>{key.replace(/([A-Z])/g, " $1")}<input type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} value={value} onChange={(event) => setCustomer((current) => ({ ...current, [key]: event.target.value }))}/></label>)}</div>
            {fulfillmentType === "delivery" ? <><h3>Prototype Delivery Address</h3><div className="dev-checkout-fields">{Object.entries(address).map(([key, value]) => <label className="dev-field-label" key={key}>{key.replace(/([A-Z])/g, " $1")}<input value={value} onChange={(event) => setAddress((current) => ({ ...current, [key]: event.target.value }))}/></label>)}</div></> : null}
            <label className="dev-field-label">Order notes<textarea value={notes} maxLength={500} onChange={(event) => setNotes(event.target.value)}/></label>{error ? <p className="dev-dietary-warning" role="alert">{error}</p> : null}<div className="dev-checkout-actions"><button type="button" onClick={() => setStep("fulfillment")}>Back</button><button className="dev-add-cart-button" type="button" onClick={proceedToReview}>Review Prototype Order</button></div></section> : null}

        {step === "review" ? <section className="dev-builder-step"><h2>Order Review</h2><p>{fulfillmentType === "dine_in" ? "Dine In" : fulfillmentType[0].toUpperCase() + fulfillmentType.slice(1)} · {customer.firstName} {customer.lastName} · {customer.email} · {customer.phone}</p>
            <div className="dev-checkout-review-items">{items.map((item) => {
                if (isDrinkCartItem(item)) return <article key={item.id}><h3>{item.drinkType === "fountain" ? "Fountain Drink" : "Straight Energy Drink"}</h3>{comboLabel(item) ? <p className="dev-data-note">{comboLabel(item)}</p> : null}<p>{item.drinkType === "fountain" ? MENU.drinkBases.find((base) => base.id === item.baseId)?.name : `${MENU.energyBrands.find((brand) => brand.id === item.energyBrandId)?.name} · ${item.energyVariantId}`}</p><p>Quantity {item.quantity} · {item.pricingState === "tbd" ? "Price TBD" : `${formatMoney(item.unitBasePrice)} each · ${formatMoney(item.unitBasePrice * item.quantity)}`}</p></article>;
                if (isPotionCartItem(item)) {
                    const potionPricing = calculatePotionPricing(item);
                    return <article key={item.id}><h3>{item.potionId === "custom" ? "Build Your Own Potion" : MENU.potions.find((potion) => potion.id === item.potionId)?.name}</h3>{comboLabel(item) ? <p className="dev-data-note">{comboLabel(item)}</p> : null}<p>Base: {MENU.drinkBases.find((base) => base.id === item.baseId)?.name} · Flavors: {item.flavorIds.map((id) => MENU.potionFlavors.find((flavor) => flavor.id === id)?.name ?? id).join(", ") || "None"}</p><p>Enhancements: {item.enhancementIds.map((id) => MENU.potionEnhancements.find((entry) => entry.id === id)?.name ?? id).join(", ") || "None"} · Shimmer: {item.shimmerIds.map((id) => MENU.shimmers.find((entry) => entry.id === id)?.name ?? id).join(" + ") || "None"}</p><p>Energy: {item.energyAddInId ? `${item.energyAddInId} · ${item.energyBrandId} · ${item.energyVariantId}` : "None"} · Quantity {item.quantity} · {formatMoney(item.unitBasePrice)} each · {formatMoney(item.unitBasePrice * item.quantity)}</p>{potionPricing.hasUnresolvedAdditionalFlavorPrice ? <p className="dev-data-note">Additional flavor price remains TBD and is not included in the known-price total.</p> : null}</article>;
                }
                const selectedCrust = MENU.ingredients.find((entry) => entry.id === item.crustId);
                const selectedSize = PIZZA_SIZES.find((entry) => entry.id === item.sizeId);
                return <article key={item.id}><h3>{item.pizzaId === "custom" ? "Build Your Own Pizza" : MENU.pizzas.find((pizza) => pizza.id === item.pizzaId)?.name}</h3>{comboLabel(item) ? <p className="dev-data-note">{comboLabel(item)}</p> : null}<p>{selectedSize?.label ?? item.sizeId} · {item.crustId === "pizza-pocket" ? `Pizza Pocket · ${item.pocketDoughId} dough · +$1.00 fold` : selectedCrust?.name ?? item.crustId} · {PIZZA_CUT_LABELS[item.cutStyle ?? "eight-slice"]}</p><p>Pre-bake: {item.preBakeIngredientIds.map((id) => `${ingredientName(id)}${item.toppingAmounts?.[id] ? ` (${item.toppingAmounts[id]} · ${item.toppingPlacements?.[id] ?? "whole"})` : ""}`).join(", ") || "None"}</p><p>Finishes: {item.postBakeIngredientIds.map((id) => `${ingredientName(id)} (${item.crustId === "pizza-pocket" ? "over folded crust" : item.finishPlacements?.[id] ?? "whole"})`).join(", ") || "None"}</p><p>Quantity {item.quantity} · {formatMoney(item.unitBasePrice)} each · {formatMoney(item.unitBasePrice * item.quantity)}</p></article>;
            })}</div>
            <dl className="dev-live-price"><div><dt>{totals.hasUnresolvedPrice ? "Known-price subtotal" : "Subtotal"}</dt><dd>{formatMoney(totals.subtotal)}{totals.hasUnresolvedPrice ? " + TBD items" : ""}</dd></div><div><dt>Tax</dt><dd>Calculated later</dd></div><div><dt>Delivery fees</dt><dd>{fulfillmentType === "delivery" ? "TBD" : "None"}</dd></div></dl>
            <p className="dev-data-note">This is a non-payment prototype. Placing it will not contact a restaurant or collect payment.</p><div className="dev-checkout-actions"><button type="button" onClick={() => setStep("customer")}>Back</button><button className="dev-add-cart-button" type="button" onClick={placePrototypeOrder}>Place Prototype Order</button></div>
        </section> : null}
    </main>;
}
