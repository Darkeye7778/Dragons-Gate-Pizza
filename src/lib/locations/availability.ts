import type { Location, LocationIngredientAvailability } from "@/lib/menu/types";

export const LOCATIONS: Location[] = [
    {
        id: "default-location",
        name: "Dragon's Gate Pizza - Default Location",
        isEnabled: true,
    },
];

export const LOCATION_INGREDIENT_AVAILABILITY: LocationIngredientAvailability[] = [
    // Example 86 items:
    // {
    //   locationId: "default-location",
    //   ingredientId: "pineapple",
    //   isAvailable: false,
    //   updatedAtISO: new Date().toISOString(),
    // },
];

export function getLocationById(locationId: string): Location | null {
    return LOCATIONS.find((location) => location.id === locationId) ?? null;
}

export function getDefaultLocation(): Location {
    const enabledLocation = LOCATIONS.find((location) => location.isEnabled);
    if (!enabledLocation) {
        throw new Error("No enabled location found.");
    }

    return enabledLocation;
}

export function getAvailabilityForLocation(
    locationId: string,
): LocationIngredientAvailability[] {
    return LOCATION_INGREDIENT_AVAILABILITY.filter(
        (entry) => entry.locationId === locationId,
    );
}

export function isIngredientAvailableAtLocation(
    locationId: string,
    ingredientId: string,
): boolean {
    const entry = LOCATION_INGREDIENT_AVAILABILITY.find(
        (item) => item.locationId === locationId && item.ingredientId === ingredientId,
    );

    if (!entry) {
        return true;
    }

    return entry.isAvailable;
}