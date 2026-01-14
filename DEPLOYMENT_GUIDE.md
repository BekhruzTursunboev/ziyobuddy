# ZiyoBuddy Deployment Guide

## Quick Start

### 1. Get Your Groq API Key

1. Go to https://console.groq.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `gsk_`)

### 2. Deploy to Vercel (Recommended)

#### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel login
cd ziyobuddy
vercel
```

When prompted:

- Set environment variable: `GROQ_API_KEY` = your_api_key_here
- Follow the prompts to complete deployment

#### Option B: Using Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up/log in
3. Click "Add New Project"
4. Import your GitHub repository
5. Click "Environment Variables"
6. Add:
   - Name: `GROQ_API_KEY`
   - Value: `your_api_key_here` (paste your Groq API key)
7. Click "Deploy"

### 3. Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign up/log in
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click "Show advanced" → "Environment variables"
7. Add:
   - Key: `GROQ_API_KEY`
   - Value: `your_api_key_here`
8. Click "Deploy site"

### 4. Deploy to Other Platforms

For any platform that supports Next.js:

1. Ensure Node.js 18+ is installed
2. Set environment variable: `GROQ_API_KEY=your_api_key_here`
3. Run: `npm run build`
4. Run: `npm start`

## Environment Variables

### Required

- `GROQ_API_KEY` - Your Groq API key (server-side, secure)

### Optional

- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key (backup, not currently used)

## Troubleshooting

### API Error (401): Invalid API Key

**Problem:** The API returns 401 error when deployed

**Solutions:**

1. Check that `GROQ_API_KEY` is set in your deployment platform's environment variables
2. Verify the API key is correct (starts with `gsk_`)
3. Make sure you're using `GROQ_API_KEY` (server-side) not `NEXT_PUBLIC_GROQ_API_KEY` (client-side)
4. After setting the environment variable, redeploy your application

### API Not Working After Deployment

**Problem:** The API route doesn't work in production

**Solutions:**

1. Check deployment logs for errors
2. Verify the environment variable is set correctly
3. Ensure the `/api/chat` route is being called from the frontend
4. Check that the deployment platform supports server-side functions

### CORS Errors

**Problem:** CORS errors when calling the API

**Solutions:**

1. The API route is server-side, so CORS should not be an issue
2. Ensure you're calling `/api/chat` (relative path) not the Groq API directly
3. Check that your deployment platform supports Next.js API routes

### Rate Limiting

**Problem:** Too many requests or rate limit errors

**Solutions:**

1. Groq has rate limits - check your plan
2. The app includes retry logic with exponential backoff
3. Consider upgrading your Groq plan if you hit limits frequently
4. Implement caching for common queries

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` file:

   ```bash
   GROQ_API_KEY=your_api_key_here
   ```

3. Run development server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

## Production Build

```bash
npm run build
npm start
```

## Security Notes

⚠️ **IMPORTANT:**

1. **Never commit `.env.local` to version control** - It contains sensitive API keys
2. **Use server-side environment variables** - `GROQ_API_KEY` is only accessible on the server
3. **The API key is secure** - It's never exposed to the browser
4. **The `/api/chat` route handles all API calls** - Don't call external APIs directly from the client

## Architecture

```
Browser (Client)
    ↓
Next.js Frontend (app/page.tsx)
    ↓
/api/chat (Next.js API Route - Server-side)
    ↓
Groq API
```

This architecture ensures:

- API keys are never exposed to the browser
- Better security for production deployments
- Proper error handling and retry logic
- Timeout handling (30 seconds)

## Deployment Checklist

Before deploying, ensure:

- [ ] You have a valid Groq API key
- [ ] `.env.local` is in `.gitignore`
- [ ] `GROQ_API_KEY` environment variable is set in deployment platform
- [ ] Build completes successfully locally (`npm run build`)
- [ ] API route is working (`/api/chat` exists)
- [ ] No API keys are committed to git

## Support

If you encounter issues:

1. Check the deployment logs
2. Verify environment variables are set
3. Test locally with `npm run dev`
4. Check Groq API status at https://status.groq.com/
5. Review this guide's troubleshooting section

## Features

- ✅ Server-side API calls (secure)
- ✅ Retry logic with exponential backoff
- ✅ Timeout handling (30 seconds)
- ✅ Error handling with user-friendly messages
- ✅ Support for Uzbek language responses
- ✅ Academic-focused responses
- ✅ Dark/Light theme support
- ✅ Todo list functionality
- ✅ Message history
- ✅ Like/Save messages
