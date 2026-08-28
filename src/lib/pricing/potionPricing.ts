import { MENU } from "@/data/menu";
import { roundMoney } from "@/lib/pricing/calc";
import type { Money } from "@/lib/pricing/types";

export type PotionPricingSnapshot = {
    basePrice: Money;
    enhancementCharge: Money;
    energyCharge: Money;
    unitPrice: Money;
};

export function calculatePotionPricing({
    potionId,
    enhancementIds,
    energyAddInId,
}: {
    potionId: string;
    enhancementIds: string[];
    energyAddInId?: string;
}): PotionPricingSnapshot {
    const signature = MENU.potions.find((potion) => potion.id === potionId);
    const basePrice = signature?.basePrice ?? MENU.buildYourOwnPotionPrice;
    const enhancementCharge = roundMoney(
        enhancementIds.reduce((sum, id) => {
            return sum + (MENU.potionEnhancements.find((item) => item.id === id)?.priceDelta ?? 0);
        }, 0),
    );
    const energyCharge = MENU.energyAddIns.find((item) => item.id === energyAddInId)?.priceDelta ?? 0;

    return {
        basePrice,
        enhancementCharge,
        energyCharge,
        unitPrice: roundMoney(basePrice + enhancementCharge + energyCharge),
    };
}
