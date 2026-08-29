import { MENU } from "@/data/menu";
import { roundMoney } from "@/lib/pricing/calc";
import type { Money } from "@/lib/pricing/types";

export type PotionPricingSnapshot = {
    basePrice: Money;
    includedFlavorAllowance: number;
    additionalFlavorCount: number;
    additionalFlavorCharge: Money | null;
    hasUnresolvedAdditionalFlavorPrice: boolean;
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
    const basePrice = signature?.basePrice ?? MENU.buildYourOwnPotionPrice;
    const includedFlavorAllowance = signature?.defaultFlavorIds.length ?? 2;
    const additionalFlavorCount = Math.max(0, flavorIds.length - includedFlavorAllowance);
    const additionalFlavorCharge = additionalFlavorCount === 0
        ? 0
        : MENU.additionalPotionFlavorPrice === null
            ? null
            : roundMoney(additionalFlavorCount * MENU.additionalPotionFlavorPrice);
    const includedEnhancementAllowance = signature?.defaultEnhancementIds.length ?? 0;
    const enhancementCharge = roundMoney(
        enhancementIds.slice(includedEnhancementAllowance).reduce((sum, id) => {
            return sum + (MENU.potionEnhancements.find((item) => item.id === id)?.priceDelta ?? 0);
        }, 0),
    );
    const energyCharge = MENU.energyAddIns.find((item) => item.id === energyAddInId)?.priceDelta ?? 0;

    return {
        basePrice,
        includedFlavorAllowance,
        additionalFlavorCount,
        additionalFlavorCharge,
        hasUnresolvedAdditionalFlavorPrice: additionalFlavorCharge === null,
        includedEnhancementAllowance,
        enhancementCharge,
        energyCharge,
        unitPrice: roundMoney(basePrice + (additionalFlavorCharge ?? 0) + enhancementCharge + energyCharge),
    };
}
