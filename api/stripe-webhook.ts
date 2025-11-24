```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// Initialize SES Client
const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

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
        return response.status(400).json({ error: `Webhook Error: ${ err.message } ` });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            
            console.log('✅ Payment successful for session:', session.id);
            console.log('Customer email:', session.customer_email);
            
            // Send confirmation email directly via SES
            try {
                const command = new SendEmailCommand({
                    Source: process.env.AWS_SES_SENDER_EMAIL || "noreply@thekandelagroup.com",
                    Destination: {
                        ToAddresses: [session.customer_email || ""],
                    },
                    Message: {
                        Subject: {
                            Data: 'Receipt: Ad Submission - PostBudgetAds.com',
                        },
                        Body: {
                            Html: {
                                Data: generateConfirmationEmailHTML(session.metadata, session.amount_total),
                            },
                            Text: {
                                Data: generateConfirmationEmailText(session.metadata, session.amount_total),
                            },
                        },
                    },
                });

                const result = await sesClient.send(command);
                console.log("✅ Confirmation email sent via SES. MessageId:", result.MessageId);
            } catch (emailError: any) {
                console.error('❌ Failed to send confirmation email:', emailError);
                console.error('Error details:', JSON.stringify(emailError, null, 2));
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
            console.log(`Unhandled event type: ${ event.type } `);
    }

    return response.status(200).json({ received: true });
}

function generateConfirmationEmailHTML(metadata: any, amountTotal: number | null): string {
    const locations = JSON.parse(metadata.locations || '[]');
    const locationsList = locations.map((loc: any) => `${ loc.county }, ${ loc.state } `).join('; ');
    const formattedAmount = amountTotal ? `$${ (amountTotal / 100).toFixed(2) } ` : '$0.00';

    return `
    < !DOCTYPE html >
        <html>
        <head>
        body {
    font - family: 'Patrick Hand', cursive, Arial, sans - serif;
    background - color: rgb(253, 251, 247); /* Replaced hex to avoid parser error */
    color: rgb(26, 26, 26);
    padding: 20px;
}
                .container {
    max - width: 600px;
    margin: 0 auto;
    background: white;
    border: 4px solid black;
    padding: 30px;
}
                .header {
    text - align: center;
    border - bottom: 2px solid black;
    padding - bottom: 20px;
    margin - bottom: 20px;
}
                .header h1 {
    color: rgb(0, 100, 100);
    margin: 0;
}
                .content {
    line - height: 1.6;
}
                .receipt - box {
    border: 2px dashed black;
    padding: 15px;
    margin: 20px 0;
    background: rgb(240, 240, 240);
}
                .ad - details {
    background: rgb(249, 249, 249);
    border - left: 4px solid rgb(0, 100, 100);
    padding: 15px;
    margin: 20px 0;
}
                .category {
    background: rgb(0, 100, 100);
    color: white;
    padding: 5px 10px;
    display: inline - block;
    font - weight: bold;
    margin - bottom: 10px;
}
                .important {
    background: rgb(255, 243, 205);
    border: 2px solid rgb(255, 193, 7);
    padding: 15px;
    margin: 20px 0;
}
                .footer {
    text - align: center;
    margin - top: 30px;
    padding - top: 20px;
    border - top: 2px solid black;
    color: rgb(102, 102, 102);
}
</style>
    </head>
    < body >
    <div class="container" >
        <div class="header" >
            <h1>PostBudgetAds.com </h1>
            < p > Order Confirmation & Receipt </p>
                </div>

                < div class="content" >
                    <p>Hello, </p>

                    < p > Thank you for your order.We have received your payment and ad submission.</p>

                        < div class="receipt-box" >
                            <h3 style="margin-top:0;" >🧾 Payment Receipt </h3>
                                < p > <strong>Total Paid: </strong> ${formattedAmount}</p >
                                    <p><strong>Date: </strong> ${new Date().toLocaleDateString()}</p >
                                        </div>

                                        < div class="ad-details" >
                                            <div class="category" > ${ metadata.category } </div>
                                                < p > <strong>Ad Content: </strong><br>${metadata.adContent}</p >
                                                    <p><strong>Locations: </strong> ${locationsList}</p >
                                                        </div>

                                                        < div class="important" >
                                                            <p><strong>⏱️ Moderation Notice < /strong></p >
                                                                <p>Your post is currently under review.Please allow < strong > up to 2 hours < /strong> for your post to go live on the site.</p >
                                                                    <p><strong>Refund Policy: </strong> If your post is rejected for any reason during moderation, you will automatically receive a <strong>100% refund</strong > to your original payment method.</p>
                                                                        </div>

                                                                        < p > You can view your ad once it's approved by visiting PostBudgetAds.com and selecting your location.</p>
                                                                            </div>

                                                                            < div class="footer" >
                                                                                <p>PostBudgetAds.com - The Community's Paper</p>
                                                                                    < p > Sent from: noreply @thekandelagroup.com</p>
                                                                                        </div>
                                                                                        </div>
                                                                                        </body>
                                                                                        </html>
                                                                                            `;
}

function generateConfirmationEmailText(metadata: any, amountTotal: number | null): string {
    const locations = JSON.parse(metadata.locations || '[]');
    const locationsList = locations.map((loc: any) => `${ loc.county }, ${ loc.state } `).join('; ');
    const formattedAmount = amountTotal ? `$${ (amountTotal / 100).toFixed(2) } ` : '$0.00';

    return `
PostBudgetAds.com - Order Confirmation & Receipt

Thank you for your order.We have received your payment and ad submission.

🧾 PAYMENT RECEIPT
Total Paid: ${ formattedAmount }
Date: ${ new Date().toLocaleDateString() }

AD DETAILS
Category: ${ metadata.category }
Ad Content: ${ metadata.adContent }
Locations: ${ locationsList }

MODERATION NOTICE:
Your post is currently under review.Please allow up to 2 hours for your post to go live on the site.

REFUND POLICY:
If your post is rejected for any reason during moderation, you will automatically receive a 100 % refund to your original payment method.

You can view your ad once it's approved by visiting PostBudgetAds.com and selecting your location.

---
    PostBudgetAds.com - The Community's Paper
Sent from: noreply @thekandelagroup.com
    `;
}
```
