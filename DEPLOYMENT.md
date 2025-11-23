# Deployment Guide

## Environment Variables Setup

This application requires the following environment variables to be set in your deployment platform:

### Required Variables

```
VITE_API_KEY=your_gemini_api_key
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

## Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `VITE_API_KEY`
   - **Value**: Your Gemini API key
   - **Environment**: Production, Preview, Development (select all)
4. Repeat for `VITE_OPENWEATHER_API_KEY` and `VITE_GOOGLE_PLACES_API_KEY`
5. **Redeploy** your application for changes to take effect

### Vercel CLI Method

```bash
vercel env add VITE_API_KEY production
vercel env add VITE_OPENWEATHER_API_KEY production
vercel env add VITE_GOOGLE_PLACES_API_KEY production
```

## GitHub Pages Deployment

GitHub Pages serves static files and doesn't support environment variables at runtime. You have two options:

### Option 1: Build Locally with Environment Variables

1. Set environment variables in your `.env.local` file
2. Build the project locally:
   ```bash
   npm run build
   ```
3. Deploy the `dist` folder to GitHub Pages

### Option 2: Use GitHub Actions with Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Add repository secrets:
   - `VITE_API_KEY`
   - `VITE_OPENWEATHER_API_KEY`
   - `VITE_GOOGLE_PLACES_API_KEY`

4. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        env:
          VITE_API_KEY: ${{ secrets.VITE_API_KEY }}
          VITE_OPENWEATHER_API_KEY: ${{ secrets.VITE_OPENWEATHER_API_KEY }}
          VITE_GOOGLE_PLACES_API_KEY: ${{ secrets.VITE_GOOGLE_PLACES_API_KEY }}
        run: npm run build
        
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Troubleshooting

### Blank Page After Deployment

If you see a blank page:
1. Check browser console for errors
2. Verify environment variables are set correctly
3. Ensure you've rebuilt/redeployed after adding variables
4. Check that variable names have the `VITE_` prefix

### API Keys Not Working

- Vite only exposes variables prefixed with `VITE_`
- Variables are embedded at **build time**, not runtime
- After changing environment variables, you **must rebuild**

## Security Notes

- Never commit `.env.local` to git (it's in `.gitignore`)
- API keys in environment variables are embedded in the client-side bundle
- For sensitive operations, use a backend API instead
- Consider implementing rate limiting and API key rotation
