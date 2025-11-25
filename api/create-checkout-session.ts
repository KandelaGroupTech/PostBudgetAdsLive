import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia',
});

const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

        // Store ad data in Supabase first to avoid Stripe metadata size limits
        const { data: tempAd, error: dbError } = await supabase
            .from('ads')
            .insert({
                content: adData.content,
                category: adData.category,
                locations: adData.locations,
                email: adData.email,
                phone: adData.phone || null,
                address: adData.address || null,
                status: 'pending_payment', // New status for ads awaiting payment
                subtotal: adData.locations.length * 500,
                tax: Math.round(adData.locations.length * 500 * 0.0625),
                total_amount: Math.round(adData.locations.length * 500 * 1.0625),
                attachment_url: adData.attachment_url || null,
                attachment_type: adData.attachment_type || null,
            })
            .select()
            .single();

        if (dbError || !tempAd) {
            console.error('Database error:', dbError);
            throw new Error('Failed to store ad data');
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

        // Create Stripe Checkout Session with only the ad ID in metadata
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${request.headers.origin || 'https://www.postbudgetads.com'}?success=true`,
            cancel_url: `${request.headers.origin || 'https://www.postbudgetads.com'}?canceled=true`,
            customer_email: adData.email,
            metadata: {
                adId: tempAd.id, // Only store the ad ID, not the full data
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
