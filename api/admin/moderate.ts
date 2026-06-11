
import { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb } from '../utils/firebaseAdmin';
import Stripe from 'stripe';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
});

const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { adId, action, comment } = request.body;

    if (!adId || !['approve', 'reject'].includes(action)) {
        return response.status(400).json({ error: 'Invalid request parameters' });
    }

    try {
        // 1. Fetch the ad
        const docRef = adminDb.collection('ads').doc(adId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return response.status(404).json({ error: 'Ad not found' });
        }
        const ad = docSnap.data() as any;

        if (ad.status !== 'pending') {
            return response.status(400).json({ error: 'Ad is not pending review' });
        }

        // 2. Handle Action
        if (action === 'approve') {
            // Update DB
            await docRef.update({
                status: 'approved',
                admin_comment: comment
            });

            // Send Email
            try {
                console.log('📧 Sending approval email to:', ad.email);
                await sendEmail(ad.email, 'Your Ad is Live! - PostBudgetAds.com', `
                    <h1>Your Ad has been Approved!</h1>
                    <p>Great news! Your ad has been approved and is now live on PostBudgetAds.com.</p>
                    ${comment ? `<p><strong>Admin Note:</strong> ${comment}</p>` : ''}
                    <p><a href="https://postbudgetads.com">View your ad here</a></p>
                `);
                console.log('✅ Approval email sent successfully');
            } catch (emailError: any) {
                console.error('❌ Failed to send approval email:', emailError);
                console.error('Email error details:', JSON.stringify(emailError, null, 2));
                // Don't throw - we still want to return success for the approval
            }


        } else if (action === 'reject') {
            // Refund Stripe
            if (ad.payment_intent_id) {
                await stripe.refunds.create({
                    payment_intent: ad.payment_intent_id,
                    reason: 'requested_by_customer', // Closest fit for "moderation rejection"
                });
            }

            // Update DB
            await docRef.update({
                status: 'rejected',
                admin_comment: comment
            });

            // Send Email
            try {
                console.log('📧 Sending rejection email to:', ad.email);
                await sendEmail(ad.email, 'Update regarding your Ad - PostBudgetAds.com', `
                    <h1>Ad Submission Update</h1>
                    <p>We reviewed your ad submission and unfortunately it could not be approved at this time.</p>
                    <p><strong>Reason:</strong> ${comment || 'Violation of community guidelines'}</p>
                    <p><strong>Refund Status:</strong> A full refund has been initiated to your original payment method. Please allow 5-10 business days for it to appear.</p>
                `);
                console.log('✅ Rejection email sent successfully');
            } catch (emailError: any) {
                console.error('❌ Failed to send rejection email:', emailError);
                console.error('Email error details:', JSON.stringify(emailError, null, 2));
                // Don't throw - we still want to return success for the rejection
            }
        }

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error('Moderation error:', error);
        return response.status(500).json({ error: error.message });
    }
}

async function sendEmail(to: string, subject: string, html: string) {
    const command = new SendEmailCommand({
        Source: process.env.AWS_SES_SENDER_EMAIL || "noreply@postbudgetads.com",
        Destination: { ToAddresses: [to] },
        Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: html } }
        }
    });
    await sesClient.send(command);
}
