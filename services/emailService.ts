// Email service using AWS SES
import { AdSubmission } from '../types';

interface EmailParams {
    to: string;
    subject: string;
    htmlBody: string;
    textBody: string;
}

/**
 * Send email using AWS SES
 * Note: This is a client-side placeholder. In production, this should be called from your backend.
 */
const sendEmail = async (params: EmailParams): Promise<boolean> => {
    try {
        // In production, this would call your backend API endpoint
        // which would then use AWS SDK to send via SES
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        return response.ok;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

/**
 * Send confirmation email after ad submission
 */
export const sendAdConfirmationEmail = async (
    adData: AdSubmission
): Promise<boolean> => {
    const locationsList = adData.locations
        .map(loc => `${loc.county}, ${loc.state}`)
        .join('; ');

    const htmlBody = `
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
            
            <p>We've received your ad submission. Here are the details:</p>
            
            <div class="ad-details">
                <div class="category">${adData.category}</div>
                <p><strong>Ad Content:</strong><br>${adData.content}</p>
                <p><strong>Locations:</strong> ${locationsList}</p>
                <p><strong>Total Paid:</strong> $${adData.totalAmount.toFixed(2)}</p>
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

    const textBody = `
PostBudgetAds.com - Thank You for Your Submission!

We've received your ad submission. Here are the details:

Category: ${adData.category}
Ad Content: ${adData.content}
Locations: ${locationsList}
Total Paid: $${adData.totalAmount.toFixed(2)}

MODERATION NOTICE:
Your post is subject to moderation. Please allow up to 2 hours for your post to go live.
If your post is rejected for any reason, you will receive a 100% refund to your payment method automatically.

You can view your ad once it's approved by visiting PostBudgetAds.com and selecting your location.

Thank you for supporting local communities!

---
PostBudgetAds.com - The Community's Paper
This is an automated confirmation email. Please do not reply.
    `;

    return await sendEmail({
        to: adData.email,
        subject: 'Ad Submission Received - PostBudgetAds.com',
        htmlBody,
        textBody,
    });
};

/**
 * Backend API endpoint example (to be implemented on your server)
 * 
 * This is what your backend endpoint should look like:
 * 
 * ```typescript
 * import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
 * 
 * const sesClient = new SESClient({ 
 *     region: "us-east-1",
 *     credentials: {
 *         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 *         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
 *     }
 * });
 * 
 * export async function POST(request: Request) {
 *     const { to, subject, htmlBody, textBody } = await request.json();
 *     
 *     const command = new SendEmailCommand({
 *         Source: "noreply@postbudgetads.com", // Must be verified in SES
 *         Destination: {
 *             ToAddresses: [to],
 *         },
 *         Message: {
 *             Subject: {
 *                 Data: subject,
 *             },
 *             Body: {
 *                 Html: {
 *                     Data: htmlBody,
 *                 },
 *                 Text: {
 *                     Data: textBody,
 *                 },
 *             },
 *         },
 *     });
 *     
 *     try {
 *         await sesClient.send(command);
 *         return new Response(JSON.stringify({ success: true }), { status: 200 });
 *     } catch (error) {
 *         console.error("SES Error:", error);
 *         return new Response(JSON.stringify({ success: false }), { status: 500 });
 *     }
 * }
 * ```
 */
