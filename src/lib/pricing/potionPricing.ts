import { MENU } from "@/data/menu";
import { roundMoney } from "@/lib/pricing/calc";
import {
    ADDITIONAL_POTION_FLAVOR_PRICE,
    BUILD_YOUR_OWN_POTION_PRICE,
    FOUNTAIN_DRINK_PRICE,
    INCLUDED_BYO_POTION_FLAVORS,
} from "@/lib/pricing/priceTable";
import type { Money } from "@/lib/pricing/types";

export type PotionPricingSnapshot = {
    productKind: "regular-soda" | "byo-potion" | "signature-potion";
    basePrice: Money;
    includedFlavorAllowance: number;
    additionalFlavorCount: number;
    additionalFlavorCharge: Money;
    includedEnhancementAllowance: number;
    enhancementCharge: Money;
    energyCharge: Money;
    unitPrice: Money;
};

export function calculatePotionPricing({
    potionId,
    flavorIds,
    enhancementIds,
    energyAddInId,
}: {
    potionId: string;
    flavorIds: string[];
    enhancementIds: string[];
    energyAddInId?: string;
}): PotionPricingSnapshot {
    const signature = MENU.potions.find((potion) => potion.id === potionId);
    const productKind = signature ? "signature-potion" : flavorIds.length === 0 ? "regular-soda" : "byo-potion";
    const basePrice = signature?.basePrice
        ?? (productKind === "regular-soda" ? FOUNTAIN_DRINK_PRICE : BUILD_YOUR_OWN_POTION_PRICE);
    const includedFlavorAllowance = signature?.defaultFlavorIds.length ?? INCLUDED_BYO_POTION_FLAVORS;
    const additionalFlavorCount = Math.max(0, flavorIds.length - includedFlavorAllowance);
    const additionalFlavorCharge = roundMoney(additionalFlavorCount * ADDITIONAL_POTION_FLAVOR_PRICE);
    const includedEnhancementAllowance = signature?.defaultEnhancementIds.length ?? 0;
    const enhancementCharge = roundMoney(
        enhancementIds.slice(includedEnhancementAllowance).reduce((sum, id) => {
            return sum + (MENU.potionEnhancements.find((item) => item.id === id)?.priceDelta ?? 0);
        }, 0),
    );
    const energyCharge = MENU.energyAddIns.find((item) => item.id === energyAddInId)?.priceDelta ?? 0;

    return {
        productKind,
        basePrice,
        includedFlavorAllowance,
        additionalFlavorCount,
        additionalFlavorCharge,
        includedEnhancementAllowance,
        enhancementCharge,
        energyCharge,
        unitPrice: roundMoney(basePrice + additionalFlavorCharge + enhancementCharge + energyCharge),
    };
}
