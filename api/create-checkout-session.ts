import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia',
});

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { adData } = request.body;

        if (!adData || !adData.locations || !adData.email) {
            return response.status(400).json({ error: 'Missing required ad data' });
        }

        // Calculate line items
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = adData.locations.map((loc: any) => ({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Ad Posting - ${loc.county}, ${loc.state}`,
                    description: `${adData.category} ad in ${loc.county}, ${loc.state}`,
                },
                unit_amount: 500, // $5.00 in cents
            },
            quantity: 1,
        }));

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${request.headers.origin || 'https://www.postbudgetads.com'}?success=true`,
            cancel_url: `${request.headers.origin || 'https://www.postbudgetads.com'}?canceled=true`,
            customer_email: adData.email,
            metadata: {
                adContent: adData.content,
                category: adData.category,
                email: adData.email,
                phone: adData.phone || '',
                address: adData.address || '',
                locations: JSON.stringify(adData.locations),
            },
        });

        return response.status(200).json({
            sessionId: session.id,
            url: session.url,
        });
    } catch (error: any) {
        console.error('Stripe session creation error:', error);
        return response.status(500).json({
            error: 'Failed to create checkout session',
            details: error.message,
        });
    }
}
