import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixWebhook() {
    console.log('🔍 Reading .env.local...');

    let envContent;
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        envContent = fs.readFileSync(envPath, 'utf-8');
    } catch (err) {
        console.error('❌ Could not read .env.local. Make sure it exists in the root directory.');
        process.exit(1);
    }

    // Simple parser for .env file
    const env = {};
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
            env[key] = value;
        }
    });

    let secretKey = env.STRIPE_SECRET_KEY;

    // Allow passing key as argument: node scripts/fix-webhook.js sk_test_...
    if (!secretKey && process.argv[2] && process.argv[2].startsWith('sk_')) {
        secretKey = process.argv[2];
    }

    if (!secretKey) {
        console.error('❌ STRIPE_SECRET_KEY not found in .env.local and not provided as argument.');
        console.log('Usage: node scripts/fix-webhook.js sk_test_...');
        process.exit(1);
    }

    if (!secretKey.startsWith('sk_test_')) {
        console.warn('⚠️  WARNING: You are using a LIVE key (' + secretKey.slice(0, 7) + '...). Be careful!');
    } else {
        console.log('✅ Found Test Key: ' + secretKey.slice(0, 12) + '...');
    }

    const stripe = new Stripe(secretKey);

    console.log('📡 Fetching Webhook Endpoints...');
    const endpoints = await stripe.webhookEndpoints.list();

    if (endpoints.data.length === 0) {
        console.log('❌ No webhook endpoints found.');
        return;
    }

    console.log(`Found ${endpoints.data.length} endpoints.`);

    for (const endpoint of endpoints.data) {
        console.log(`\nChecking Endpoint: ${endpoint.url}`);
        console.log(`Current Events: ${endpoint.enabled_events.join(', ')}`);

        // Check if this is the Vercel one (or local one if tunneling)
        if (endpoint.url.includes('postbudgetads') || endpoint.url.includes('vercel')) {
            console.log('🎯 Target Endpoint Found!');

            if (!endpoint.enabled_events.includes('checkout.session.completed')) {
                console.log('🛠️  Adding "checkout.session.completed"...');

                await stripe.webhookEndpoints.update(endpoint.id, {
                    enabled_events: [...endpoint.enabled_events, 'checkout.session.completed'],
                });

                console.log('✅ Successfully updated webhook events!');
            } else {
                console.log('✅ "checkout.session.completed" is already enabled.');
            }
        }
    }
}

fixWebhook().catch(console.error);
