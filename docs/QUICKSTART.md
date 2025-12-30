# 🚀 Quick Start

## Option 1: Test Locally (Recommended First)

```bash
# Install dependencies
npm install

# Start local Express development server
npm run dev
```

Your site will be at: **http://localhost:3000**

The M-Pesa endpoint will work at: **http://localhost:3000/api/mpesa/payment**

Test the checkout flow with phone: `254708374149`

---

## Option 2: Deploy to Production (AWS EC2)

Terraform deployment is provided under `infra/terraform/`.

1. Provision infrastructure using Terraform
2. SSH/SSM into the instance and populate the environment file:

`/etc/<project_name>/duka-replica.env`

3. Ensure your public callback is configured:

`MPESA_CALLBACK_URL=https://your-domain.com/api/mpesa/callback`

---

## ✅ Done!

Your server is live and serving the API under `/api/*`.

**Test it:**
1. Go to your domain
2. Add items to cart
3. Checkout with phone: `254708374149`
4. Check server logs for results

---

## 📊 View Logs

Use your process manager logs (systemd journal, pm2, docker logs, etc.).

---

## 🔄 Update Site

After making changes, redeploy the code to the instance and restart the service.

---

## Need Help?

See `infra/terraform/README.md` for deployment instructions.
