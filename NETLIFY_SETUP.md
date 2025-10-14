# Netlify Deployment Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Netlify CLI

```bash
npm install
```

### Step 2: Login to Netlify

```bash
npx netlify login
```

This will open your browser to login/signup (it's free!)

### Step 3: Initialize Your Site

```bash
npx netlify init
```

Follow the prompts:
- **Create & configure a new site** (choose this)
- **Team**: Select your team or personal account
- **Site name**: `kejayacapo-duka` (or whatever you want)
- **Build command**: Leave empty (press Enter)
- **Publish directory**: `.` (current directory)

### Step 4: Add Environment Variables

```bash
npx netlify env:set MPESA_CONSUMER_KEY "BntxdAmlpX0pDhi2EQT5UD6hbSv8EwRQAH4cZJoyFwei5jGY"
npx netlify env:set MPESA_CONSUMER_SECRET "DySNrg18kEZAaAoX9bP9ZVkLIZW7EB1s8oJGXepI3HJVBNLl0TlGrW0FIe1zxyh3"
npx netlify env:set MPESA_SHORTCODE "174379"
npx netlify env:set MPESA_PASSKEY "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
```

### Step 5: Deploy!

```bash
npx netlify deploy --prod
```

### Step 6: Update Your Frontend

After deployment, Netlify will give you a URL like:
```
https://kejayacapo-duka.netlify.app
```

Update `checkout.js`:
```javascript
const MPESA_CONFIG = {
    apiEndpoint: 'https://kejayacapo-duka.netlify.app/.netlify/functions/mpesa-payment'
};
```

### Step 7: Update Callback URL

Go back and set the callback URL:
```bash
npx netlify env:set MPESA_CALLBACK_URL "https://kejayacapo-duka.netlify.app/.netlify/functions/mpesa-callback"
```

Then redeploy:
```bash
npx netlify deploy --prod
```

## ✅ Done!

Your site is now live at: `https://kejayacapo-duka.netlify.app`

---

## 🧪 Test Locally First

Before deploying, test locally:

```bash
npx netlify dev
```

This starts a local server at `http://localhost:8888` with your functions working!

Update `checkout.js` for local testing:
```javascript
const MPESA_CONFIG = {
    apiEndpoint: 'http://localhost:8888/.netlify/functions/mpesa-payment'
};
```

---

## 📊 View Logs

To see function logs (for debugging):

```bash
npx netlify functions:log mpesa-payment
```

Or view in the Netlify dashboard:
1. Go to https://app.netlify.com
2. Select your site
3. Functions → Select function → View logs

---

## 🔄 Update Your Site

After making changes:

```bash
npx netlify deploy --prod
```

Or set up automatic deployments:
1. Push code to GitHub
2. Connect GitHub repo in Netlify dashboard
3. Auto-deploy on every push!

---

## 🎯 Your Function URLs

After deployment, your functions will be at:

- **Payment**: `https://your-site.netlify.app/.netlify/functions/mpesa-payment`
- **Callback**: `https://your-site.netlify.app/.netlify/functions/mpesa-callback`

---

## 💡 Pro Tips

### Automatic Deployments
1. Push your code to GitHub
2. In Netlify dashboard: Site settings → Build & deploy → Link repository
3. Every git push auto-deploys!

### Custom Domain
1. Buy domain (Namecheap, GoDaddy, etc.)
2. Netlify dashboard → Domain settings → Add custom domain
3. Update DNS records
4. Free SSL included!

### Environment Variables via Dashboard
Instead of CLI, you can add them in:
- Netlify dashboard → Site settings → Environment variables

---

## 🐛 Troubleshooting

### Function not found
- Check `netlify.toml` is in root directory
- Verify functions are in `netlify/functions/` folder

### Environment variables not working
- Make sure you set them with `netlify env:set`
- Or add them in Netlify dashboard
- Redeploy after adding variables

### CORS errors
- `netlify.toml` should have CORS headers (already configured)
- Functions return proper CORS headers (already done)

### Callback not receiving data
- Make sure callback URL is set correctly
- Check function logs: `npx netlify functions:log mpesa-callback`
- Verify M-Pesa has the correct callback URL

---

## 📚 Resources

- [Netlify Functions Docs](https://docs.netlify.com/functions/overview/)
- [Netlify CLI Docs](https://docs.netlify.com/cli/get-started/)
- [Environment Variables](https://docs.netlify.com/environment-variables/overview/)

---

## 🎉 You're Done!

No server to maintain, automatic scaling, free SSL, and global CDN!

Your M-Pesa integration is now live and production-ready! 🚀
