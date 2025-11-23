import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} else {
    console.error("❌ .env.local file not found!");
    process.exit(1);
}

const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
});

async function verify() {
    console.log("Testing AWS SES Configuration...");
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log(`Sender: ${process.env.AWS_SES_SENDER_EMAIL}`);

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.error("❌ Missing AWS Credentials in .env.local");
        return;
    }

    const command = new SendEmailCommand({
        Source: process.env.AWS_SES_SENDER_EMAIL,
        Destination: {
            ToAddresses: [process.env.AWS_SES_SENDER_EMAIL || ""], // Send to self
        },
        Message: {
            Subject: {
                Data: "PostBudgetAds AWS SES Verification",
            },
            Body: {
                Text: {
                    Data: "If you received this email, your AWS SES configuration is correct!",
                },
            },
        },
    });

    try {
        await sesClient.send(command);
        console.log("✅ Success! Test email sent to " + process.env.AWS_SES_SENDER_EMAIL);
    } catch (error) {
        console.error("❌ Failed to send email:");
        console.error(error);
    }
}

verify();
