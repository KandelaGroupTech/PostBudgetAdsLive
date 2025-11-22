// Pricing constants and utilities for ad posting

export const PRICE_PER_COUNTY = 5.00;
export const TAX_RATE = 0.06; // Montgomery County, MD sales tax (6%)

/**
 * Calculate subtotal based on number of counties
 */
export function calculateSubtotal(countyCount: number): number {
    return countyCount * PRICE_PER_COUNTY;
}

/**
 * Calculate sales tax
 */
export function calculateTax(subtotal: number, taxRate: number = TAX_RATE): number {
    return subtotal * taxRate;
}

/**
 * Calculate total amount (subtotal + tax)
 */
export function calculateTotal(subtotal: number, tax: number): number {
    return subtotal + tax;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
}

/**
 * Calculate all pricing details at once
 */
export function calculatePricing(countyCount: number) {
    const subtotal = calculateSubtotal(countyCount);
    const tax = calculateTax(subtotal);
    const total = calculateTotal(subtotal, tax);

    return {
        countyCount,
        subtotal,
        tax,
        total,
        formatted: {
            subtotal: formatCurrency(subtotal),
            tax: formatCurrency(tax),
            total: formatCurrency(total),
        }
    };
}
