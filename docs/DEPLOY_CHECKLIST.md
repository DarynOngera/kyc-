# 🚀 Deployment Checklist

Follow these steps to deploy your site to an AWS EC2 instance.

## ✅ Pre-Deployment Checklist

- [x] Code is ready
- [x] `.gitignore` configured (protects `.env`)
- [x] API handlers are under `api/`
- [x] Environment variables documented
- [ ] GitHub account ready
- [ ] AWS account ready

---

## 📋 Step-by-Step Deployment

### 1. Initialize Git Repository

```bash
cd /home/ongera/projects/kyc/duka-replica
git init
git add .
git commit -m "Initial commit: KejaYaCapo Duka with M-Pesa integration"
```

**Check:** Run `git status` - should say "nothing to commit, working tree clean"

---

### 2. Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `kejayacapo-duka`
3. Description: "E-commerce store with M-Pesa payment integration"
4. **Private** (recommended)
5. **DO NOT** check "Add README" or "Add .gitignore"
6. Click **"Create repository"**

---

### 3. Push to GitHub

GitHub will show you commands. Copy and run them:

```bash
git remote add origin https://github.com/YOUR_USERNAME/kejayacapo-duka.git
git branch -M main
git push -u origin main
```

**Check:** Refresh GitHub page - you should see all your files

---

### 4. Provision Infrastructure (Terraform)

Use the Terraform module under `infra/terraform/`.

**Check:** Terraform apply succeeds and you get a `public_ip` output.

---

### 5. Configure Environment Variables

On the server, populate the environment file:

`/etc/<project_name>/duka-replica.env`

**Check:** The file exists, is readable by the service, and contains required values (Supabase, JWT, Resend, M-Pesa).

---

### 6. Configure Domain + Callback URL

- Point your domain A record to the server public IP
- Set:

`MPESA_CALLBACK_URL=https://YOUR-DOMAIN/api/mpesa/callback`

---

### 7. Start / Restart Service

Restart the service after env changes.

**Check:** Service is active and listening on port `3000` (or your configured `PORT`).

---

### 8. Test Your Site

1. Click **"Open production deploy"** or visit your site URL
2. Browse products
3. Add to cart
4. Go to checkout
5. Test payment with: `254708374149`

**Check:** Payment initiation returns a successful STK push response and callback updates transaction status.

---

### 9. (Optional) HTTPS (Recommended)

Put nginx in front and terminate TLS with certbot.

---

## 🎉 Deployment Complete!

Your site is now live at: `https://YOUR-DOMAIN`

### What Happens Now?

✅ **Server runs continuously** - Express serves API under `/api/*`
✅ **Static IP** - Elastic IP is used for the server

---

## 🔄 Making Updates

```bash
# Make your changes
git add .
git commit -m "Updated product images"
git push
```

Redeploy the code to the server and restart the service.

---

## 📊 Monitor Your Site

### View Logs
Check your server logs (systemd journal, pm2, docker logs, etc.).

### Analytics (optional)
Add application monitoring (uptime checks, logs shipping, alerts).

---

## 🐛 Troubleshooting

### Deploy Failed
- Check server logs for errors
- Verify all files committed to Git

### API Not Working
- Verify environment variables are set
- Check server logs for errors
- Ensure `axios` is in `package.json`

### Payment Not Working
- Test with sandbox phone: `254708374149`
- Check server logs
- Verify all 5 environment variables set
- Ensure callback URL is correct

---

## 📞 Need Help?

- Check server logs
- Review `infra/terraform/README.md`

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Terraform applied successfully
- [ ] Environment variables configured on server
- [ ] Site deployed successfully on EC2
- [ ] M-Pesa payment tested
- [ ] Site URL saved/bookmarked

**Congratulations! Your e-commerce store is live! 🎉**
