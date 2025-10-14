# 🚀 Quick Start - Netlify Deployment

## Option 1: Test Locally (Recommended First)

```bash
# Install dependencies
npm install

# Start local Netlify development server
npx netlify dev
```

Your site will be at: **http://localhost:8888**

The M-Pesa function will work at: **http://localhost:8888/.netlify/functions/mpesa-payment**

Test the checkout flow with phone: `254708374149`

---

## Option 2: Deploy to Netlify (Production)

### Step 1: Login to Netlify
```bash
npx netlify login
```

### Step 2: Initialize Site
```bash
npx netlify init
```

Choose:
- ✅ Create & configure a new site
- ✅ Team: Your account
- ✅ Site name: `kejayacapo-duka`
- ✅ Build command: (leave empty)
- ✅ Publish directory: `.`

### Step 3: Add Environment Variables
```bash
npx netlify env:set MPESA_CONSUMER_KEY "BntxdAmlpX0pDhi2EQT5UD6hbSv8EwRQAH4cZJoyFwei5jGY"
npx netlify env:set MPESA_CONSUMER_SECRET "DySNrg18kEZAaAoX9bP9ZVkLIZW7EB1s8oJGXepI3HJVBNLl0TlGrW0FIe1zxyh3"
npx netlify env:set MPESA_SHORTCODE "174379"
npx netlify env:set MPESA_PASSKEY "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
```

### Step 4: Deploy
```bash
npx netlify deploy --prod
```

### Step 5: Update Callback URL

After deployment, you'll get a URL like: `https://kejayacapo-duka.netlify.app`

Set the callback:
```bash
npx netlify env:set MPESA_CALLBACK_URL "https://kejayacapo-duka.netlify.app/.netlify/functions/mpesa-callback"
```

Redeploy:
```bash
npx netlify deploy --prod
```

---

## ✅ Done!

Your site is live! No server to maintain, automatic scaling, free SSL!

**Test it:**
1. Go to your Netlify URL
2. Add items to cart
3. Checkout with phone: `254708374149`
4. Check Netlify function logs for results

---

## 📊 View Logs

```bash
npx netlify functions:log mpesa-payment
```

Or in dashboard: https://app.netlify.com → Your site → Functions

---

## 🔄 Update Site

After making changes:
```bash
npx netlify deploy --prod
```

---

## Need Help?

See `NETLIFY_SETUP.md` for detailed instructions!
