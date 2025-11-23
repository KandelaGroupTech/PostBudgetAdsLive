# PostBudgetAds - API Setup Guide

This guide explains how to configure the required API services for the PostBudgetAds application.

## Required API Services

### 1. OpenWeatherMap API (Weather Data)

**Purpose:** Display real-time weather for selected locations

**Setup Steps:**
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" and create a free account (no credit card required)
3. Go to "API keys" section in your account
4. Copy your default API key (or create a new one)
5. Add your API key to `.env.local`:
   ```
   OPENWEATHER_API_KEY=your_api_key_here
   ```

**Free Tier Benefits:**
- 1,000 API calls per day
- 60 calls per minute
- No credit card required
- No expiration

**Note:** API key activation may take up to 2 hours after signup.

---

### 2. Google Places API (Address Autocomplete)

**Purpose:** Provide address autocomplete functionality in the ad form

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security
6. Add your API key to `.env.local`:
   ```
   GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

**Pricing:** 
- Free tier: $200/month credit
- Address autocomplete: ~$2.83 per 1,000 requests
- With free credit, you get ~28,000 requests/month free

---

### 3. AWS SES (Email Service)

**Purpose:** Send confirmation emails after ad submission

**Important:** AWS SES requires a backend implementation. The email service cannot be called directly from the frontend for security reasons.

**Setup Steps:**

#### A. AWS SES Configuration
1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Verify your sender email address (e.g., noreply@postbudgetads.com)
3. Request production access (starts in sandbox mode)
4. Create IAM credentials with SES send permissions

#### B. Backend API Endpoint
You need to create a backend API endpoint at `/api/send-email`. Here's an example implementation:

**For Next.js (app/api/send-email/route.ts):**
```typescript
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { NextResponse } from "next/server";

const sesClient = new SESClient({ 
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
});

export async function POST(request: Request) {
    try {
        const { to, subject, htmlBody, textBody } = await request.json();
        
        const command = new SendEmailCommand({
            Source: "noreply@postbudgetads.com", // Must be verified in SES
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
        
        await sesClient.send(command);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("SES Error:", error);
        return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 });
    }
}
```

**Environment Variables (Backend only):**
```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

**Pricing:**
- $0.10 per 1,000 emails
- Extremely cost-effective for any volume

---

## Environment Variables Summary

Create a `.env.local` file in your project root:

```bash
# Existing
API_KEY=your_gemini_api_key

# New additions
OPENWEATHER_API_KEY=your_openweather_key
GOOGLE_PLACES_API_KEY=your_google_places_key

# Backend only (do NOT add to frontend .env)
# AWS_ACCESS_KEY_ID=your_aws_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret
# AWS_REGION=us-east-1
```

---

## Testing

### Test Weather Service
1. Run the app: `npm run dev`
2. Change the location using the location selector
3. Verify weather updates in the header

### Test Address Autocomplete
1. Open the "Post an Ad" modal
2. Start typing in the "Physical Address" field
3. Verify autocomplete suggestions appear

### Test Email Confirmation
1. Submit a test ad with a valid email address
2. Check your email inbox for the confirmation
3. Verify the email contains correct ad details

---

## Troubleshooting

### Weather not loading
- Check OpenWeatherMap API key is correct
- Wait up to 2 hours after signup for API key activation
- Verify you haven't exceeded the 1,000 calls/day limit
- Check browser console for errors

### Address autocomplete not working
- Verify Google Places API is enabled
- Check API key restrictions
- Ensure billing is enabled on Google Cloud (required even for free tier)

### Email not sending
- Verify backend endpoint is running
- Check AWS SES is out of sandbox mode
- Verify sender email is verified in SES
- Check backend logs for errors

---

## Security Notes

1. **Never commit API keys** to version control
2. **Restrict API keys** to your domain in Google Cloud Console
3. **Use environment variables** for all sensitive data
4. **Implement rate limiting** on your backend email endpoint
5. **Validate email addresses** before sending to prevent abuse
