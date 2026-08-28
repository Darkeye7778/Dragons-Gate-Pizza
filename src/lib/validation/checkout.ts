import { z } from "zod";

export const fulfillmentTypeSchema = z.enum(["pickup", "delivery", "dine_in"]);

export const checkoutCustomerSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required."),
    lastName: z.string().trim().min(1, "Last name is required."),
    email: z.string().trim().email("A valid email is required."),
    phone: z.string().trim().min(7, "A valid phone number is required."),
});

export const deliveryAddressSchema = z.object({
    addressLine1: z.string().trim().min(1, "Address line 1 is required."),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().min(1, "City is required."),
    state: z.string().trim().min(2, "State is required."),
    postalCode: z.string().trim().min(5, "Postal code is required."),
});

const pizzaPricingSchema = z.object({
    mode: z.enum(["custom", "signature"]),
    tier: z.enum(["cheese", "one_top", "two_top", "three_top", "byo", "signature"]),
    tierLabel: z.string(),
    toppingUnits: z.number().int().min(0),
    standardToppingUnits: z.number().int().min(0),
    additionalToppingUnits: z.number().int().min(0),
    signatureIncludedUnitLimit: z.number().int().min(0).nullable(),
    cheeseBasePrice: z.number().min(0),
    standardToppingCharge: z.number().min(0),
    additionalToppingCharge: z.number().min(0),
    toppingCharge: z.number().min(0),
    unitPrice: z.number().min(0),
    usesFallbackTierPrice: z.boolean(),
    priceSource: z.enum(["base-cheese-table", "signature-current-price"]),
    tuPolicyId: z.literal("distinct-selection-v1"),
});

const pizzaCartItemSchema = z.object({
    kind: z.literal("pizza").optional(),
    id: z.string().min(1),
    pizzaId: z.string().min(1),
    sizeId: z.string().min(1),
    crustId: z.string().min(1),
    preBakeIngredientIds: z.array(z.string()),
    postBakeIngredientIds: z.array(z.string()),
    toppingPlacements: z.record(z.string(), z.enum(["whole", "left", "right"])).optional(),
    quantity: z.number().int().min(1),
    unitBasePrice: z.number().min(0),
    pricing: pizzaPricingSchema.optional(),
});

const potionCartItemSchema = z.object({
    kind: z.literal("potion"),
    id: z.string().min(1),
    potionId: z.string().min(1),
    baseId: z.string().optional(),
    flavorIds: z.array(z.string()).max(2),
    enhancementIds: z.array(z.string()),
    shimmerIds: z.array(z.string()).max(2),
    energyBrandId: z.string().optional(),
    energyVariantId: z.string().optional(),
    energyAddInId: z.string().optional(),
    quantity: z.number().int().min(1),
    unitBasePrice: z.number().min(0),
});

export const cartItemSchema = z.union([pizzaCartItemSchema, potionCartItemSchema]);

export const checkoutFormSchema = z
    .object({
        fulfillmentType: fulfillmentTypeSchema,
        customer: checkoutCustomerSchema,
        address: deliveryAddressSchema.optional(),
        notes: z.string().trim().max(500).optional(),
        items: z.array(cartItemSchema).min(1, "Cart must contain at least one item."),
    })
    .superRefine((value, ctx) => {
        if (value.fulfillmentType === "delivery" && !value.address) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["address"],
                message: "Delivery address is required for delivery orders.",
            });
        }
    });

export type CheckoutFormInput = z.infer<typeof checkoutFormSchema>;
export type CheckoutCustomerInput = z.infer<typeof checkoutCustomerSchema>;
