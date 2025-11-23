import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
    api: {
        bodyParser: false,
    },
};

async function buffer(readable: any) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const buf = await buffer(request);
    const sig = request.headers['stripe-signature'];

    if (!sig) {
        return response.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return response.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;

            console.log('✅ Payment successful for session:', session.id);
            console.log('Customer email:', session.customer_email);
            console.log('Metadata:', session.metadata);

            // Send confirmation email
            try {
                const emailResponse = await fetch(`${request.headers.origin || 'https://www.postbudgetads.com'}/api/send-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: session.customer_email,
                        subject: 'Ad Submission Received - PostBudgetAds.com',
                        htmlBody: generateConfirmationEmailHTML(session.metadata),
                        textBody: generateConfirmationEmailText(session.metadata),
                    }),
                });

                if (emailResponse.ok) {
                    console.log('✅ Confirmation email sent');
                } else {
                    console.error('❌ Failed to send confirmation email');
                }
            } catch (emailError) {
                console.error('❌ Email sending error:', emailError);
            }

            // TODO: Store ad in database
            break;
        }

        case 'checkout.session.expired': {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log('⏱️ Checkout session expired:', session.id);
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    return response.status(200).json({ received: true });
}

function generateConfirmationEmailHTML(metadata: any): string {
    const locations = JSON.parse(metadata.locations || '[]');
    const locationsList = locations.map((loc: any) => `${loc.county}, ${loc.state}`).join('; ');

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: 'Patrick Hand', cursive, Arial, sans-serif;
            background-color: #FDFBF7;
            color: #1a1a1a;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border: 4px solid #000;
            padding: 30px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #006464;
            margin: 0;
        }
        .content {
            line-height: 1.6;
        }
        .ad-details {
            background: #f9f9f9;
            border-left: 4px solid #006464;
            padding: 15px;
            margin: 20px 0;
        }
        .category {
            background: #006464;
            color: white;
            padding: 5px 10px;
            display: inline-block;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .important {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #000;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PostBudgetAds.com</h1>
            <p>Thank You for Your Submission!</p>
        </div>
        
        <div class="content">
            <p>Hello,</p>
            
            <p>We've received your ad submission and payment. Here are the details:</p>
            
            <div class="ad-details">
                <div class="category">${metadata.category}</div>
                <p><strong>Ad Content:</strong><br>${metadata.adContent}</p>
                <p><strong>Locations:</strong> ${locationsList}</p>
            </div>
            
            <div class="important">
                <p><strong>⏱️ Moderation Notice</strong></p>
                <p>Your post is subject to moderation. Please allow <strong>up to 2 hours</strong> for your post to go live.</p>
                <p>If your post is rejected for any reason, you will receive a <strong>100% refund</strong> to your payment method automatically.</p>
            </div>
            
            <p>You can view your ad once it's approved by visiting PostBudgetAds.com and selecting your location.</p>
            
            <p>Thank you for supporting local communities!</p>
        </div>
        
        <div class="footer">
            <p>PostBudgetAds.com - The Community's Paper</p>
            <p>This is an automated confirmation email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateConfirmationEmailText(metadata: any): string {
    const locations = JSON.parse(metadata.locations || '[]');
    const locationsList = locations.map((loc: any) => `${loc.county}, ${loc.state}`).join('; ');

    return `
PostBudgetAds.com - Thank You for Your Submission!

We've received your ad submission and payment. Here are the details:

Category: ${metadata.category}
Ad Content: ${metadata.adContent}
Locations: ${locationsList}

MODERATION NOTICE:
Your post is subject to moderation. Please allow up to 2 hours for your post to go live.
If your post is rejected for any reason, you will receive a 100% refund to your payment method automatically.

You can view your ad once it's approved by visiting PostBudgetAds.com and selecting your location.

Thank you for supporting local communities!

---
PostBudgetAds.com - The Community's Paper
This is an automated confirmation email. Please do not reply.
    `;
}
