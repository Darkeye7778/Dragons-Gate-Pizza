import type { CartItem } from "@/lib/cart/types";

const CART_STORAGE_KEY = "dgp_cart_v0";

export function readCart(): CartItem[] {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
    } catch {
        return [];
    }
}

export function writeCart(items: CartItem[]): void {
    if (typeof window === "undefined") {
        return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(item: CartItem): CartItem[] {
    const current = readCart();
    const next = [...current, item];
    writeCart(next);
    return next;
}

export function removeFromCart(itemId: string): CartItem[] {
    const current = readCart();
    const next = current.filter((item) => item.id !== itemId);
    writeCart(next);
    return next;
}

export function updateCartItemQuantity(itemId: string, quantity: number): CartItem[] {
    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const current = readCart();

    const next = current.map((item) =>
        item.id === itemId
            ? { ...item, quantity: normalizedQuantity }
            : item,
    );

    writeCart(next);
    return next;
}

export function clearCart(): void {
    writeCart([]);
}