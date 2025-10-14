# Serverless Deployment (No Server Required!)

If you don't want to run a traditional server, you can deploy serverless functions. This means **no server to maintain**, but you still get the backend functionality.

## Option 1: Vercel (Recommended - FREE)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy

```bash
vercel
```

Follow the prompts:
- Link to your account (create one if needed)
- Set project name
- Deploy!

### 3. Add Environment Variables

In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add:
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_SHORTCODE`
   - `MPESA_PASSKEY`
   - `MPESA_CALLBACK_URL`

### 4. Update Frontend

In `checkout.js`, change:
```javascript
const MPESA_CONFIG = {
    apiEndpoint: 'https://your-project.vercel.app/api/mpesa-payment'
};
```

### Done! ✅
Your API is now live at: `https://your-project.vercel.app/api/mpesa-payment`

---

## Option 2: Netlify Functions

### 1. Create Function

Create `netlify/functions/mpesa-payment.js`:

```javascript
const axios = require('axios');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }
    
    // Same logic as Vercel function
    // ... (copy from api/mpesa-payment.js)
};
```

### 2. Deploy

```bash
netlify deploy --prod
```

---

## Option 3: Cloudflare Workers

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Create Worker

```bash
wrangler init mpesa-worker
```

### 3. Deploy

```bash
wrangler publish
```

---

## Comparison

| Platform | Free Tier | Setup | Best For |
|----------|-----------|-------|----------|
| **Vercel** | 100GB bandwidth | Easiest | Static sites + API |
| **Netlify** | 100GB bandwidth | Easy | JAMstack apps |
| **Cloudflare** | 100k requests/day | Medium | Global edge |
| **AWS Lambda** | 1M requests/month | Complex | Enterprise |

---

## Why Serverless?

✅ **No server to maintain**
✅ **Auto-scaling**
✅ **Pay only for usage**
✅ **Free tier is generous**
✅ **Global CDN**
✅ **HTTPS included**

## Why NOT Serverless?

❌ Cold starts (first request slower)
❌ Vendor lock-in
❌ Limited execution time
❌ More complex debugging

---

## Recommended: Vercel

**Pros:**
- Easiest deployment
- Great free tier
- Automatic HTTPS
- Built-in CI/CD
- Perfect for Next.js/React

**Deploy in 2 commands:**
```bash
npm install -g vercel
vercel
```

That's it! Your M-Pesa API is live without running any server.
