import { VercelRequest, VercelResponse } from '@vercel/node';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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

    const { to, subject, htmlBody, textBody } = request.body;

    if (!to || !subject || !htmlBody || !textBody) {
        return response.status(400).json({ error: 'Missing required fields' });
    }

    const command = new SendEmailCommand({
        Source: process.env.AWS_SES_SENDER_EMAIL || "noreply@postbudgetads.com",
        Destination: {
            ToAddresses: [to],
        },
        Message: {
            Subject: {
                Data: subject,
            },
            Body: {
                Html: {
                    Data: htmlBody,
                },
                Text: {
                    Data: textBody,
                },
            },
        },
    });

    try {
        await sesClient.send(command);
        return response.status(200).json({ success: true });
    } catch (error: any) {
        console.error("SES Error:", error);
        return response.status(500).json({ error: 'Failed to send email', details: error.message });
    }
}
