export function formatMoney(value: number): string {
    return `$${value.toFixed(2)}`;
}

export function formatSignedMoney(value: number): string {
    if (value > 0) return `+${formatMoney(value)}`;
    if (value < 0) return `-${formatMoney(Math.abs(value))}`;
    return formatMoney(0);
}
