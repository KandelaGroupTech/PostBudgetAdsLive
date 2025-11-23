// Stripe service for payment processing
import { AdSubmission, StripeCheckoutSession } from '../types';

/**
 * Create a Stripe Checkout session
 */
export async function createCheckoutSession(
    adData: AdSubmission
): Promise<StripeCheckoutSession> {
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ adData })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Failed to create checkout session');
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
}

/**
 * Submit an ad after successful payment
 * 
 * Note: In production, this is handled by the Stripe webhook
 * after payment is confirmed. This function is kept for future use.
 */
export async function submitAd(
    adData: AdSubmission,
    paymentId: string
): Promise<{ success: boolean; adId: string }> {
    // TODO: Replace with actual API call to your backend
    console.log('Submitting ad:', adData, 'Payment ID:', paymentId);

    return {
        success: true,
        adId: `ad_${Date.now()}`
    };
}
