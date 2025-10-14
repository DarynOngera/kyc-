# 🚀 Deployment Checklist

Follow these steps to deploy your site to Netlify via GitHub.

## ✅ Pre-Deployment Checklist

- [x] Code is ready
- [x] `.gitignore` configured (protects `.env`)
- [x] Netlify functions created
- [x] Environment variables documented
- [ ] GitHub account ready
- [ ] Netlify account ready

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

### 4. Connect to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify (if first time)
5. Select repository: **`kejayacapo-duka`**
6. Configure:
   - Branch: `main`
   - Build command: (leave empty)
   - Publish directory: `.`
   - Functions directory: `netlify/functions` (auto-detected)
7. Click **"Deploy site"**

**Check:** Wait for initial deploy (may fail - that's OK, we need to add env vars)

---

### 5. Add Environment Variables

In Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add each variable:

| Variable Name | Value |
|--------------|-------|
| `MPESA_CONSUMER_KEY` | `BntxdAmlpX0pDhi2EQT5UD6hbSv8EwRQAH4cZJoyFwei5jGY` |
| `MPESA_CONSUMER_SECRET` | `DySNrg18kEZAaAoX9bP9ZVkLIZW7EB1s8oJGXepI3HJVBNLl0TlGrW0FIe1zxyh3` |
| `MPESA_SHORTCODE` | `174379` |
| `MPESA_PASSKEY` | `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` |

4. Click **"Save"** after each

**Check:** All 4 variables should be listed

---

### 6. Set Callback URL

After first deploy, you'll get a URL like:
```
https://random-name-123.netlify.app
```

Add the callback URL:

1. **Site settings** → **Environment variables**
2. Add new variable:
   - Name: `MPESA_CALLBACK_URL`
   - Value: `https://YOUR-SITE-NAME.netlify.app/.netlify/functions/mpesa-callback`
3. Click **"Save"**

**Check:** 5 environment variables total

---

### 7. Trigger Redeploy

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for deployment to complete (usually 1-2 minutes)

**Check:** Deploy status should be green ✅

---

### 8. Test Your Site

1. Click **"Open production deploy"** or visit your site URL
2. Browse products
3. Add to cart
4. Go to checkout
5. Test payment with: `254708374149`

**Check:** STK Push should be sent to test phone

---

### 9. (Optional) Custom Site Name

1. **Site settings** → **Domain management**
2. Click **"Options"** → **"Edit site name"**
3. Change to: `kejayacapo-duka`
4. Your site: `https://kejayacapo-duka.netlify.app`

---

## 🎉 Deployment Complete!

Your site is now live at: `https://your-site-name.netlify.app`

### What Happens Now?

✅ **Auto-deploy on push** - Every `git push` triggers a new deployment
✅ **Serverless functions** - M-Pesa API calls handled automatically
✅ **Free SSL** - HTTPS enabled by default
✅ **Global CDN** - Fast loading worldwide
✅ **Automatic scaling** - Handles traffic spikes

---

## 🔄 Making Updates

```bash
# Make your changes
git add .
git commit -m "Updated product images"
git push
```

Netlify automatically deploys! Watch progress in **Deploys** tab.

---

## 📊 Monitor Your Site

### View Logs
1. **Functions** tab
2. Click `mpesa-payment` or `mpesa-callback`
3. View real-time logs

### Check Deploys
1. **Deploys** tab
2. See all deployments
3. Click any deploy to see logs

### Analytics (optional)
- **Analytics** tab
- May require paid plan

---

## 🐛 Troubleshooting

### Deploy Failed
- Check deploy log for errors
- Verify all files committed to Git
- Ensure `netlify.toml` exists

### Functions Not Working
- Verify environment variables are set
- Check function logs for errors
- Ensure `axios` is in `package.json`

### Payment Not Working
- Test with sandbox phone: `254708374149`
- Check function logs
- Verify all 5 environment variables set
- Ensure callback URL is correct

---

## 📞 Need Help?

- Check deploy logs in Netlify
- View function logs
- See [GITHUB_NETLIFY_DEPLOY.md](GITHUB_NETLIFY_DEPLOY.md) for details
- Netlify docs: https://docs.netlify.com

---

## ✅ Final Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify connected to GitHub repo
- [ ] All 5 environment variables added
- [ ] Site deployed successfully
- [ ] M-Pesa payment tested
- [ ] Site URL saved/bookmarked

**Congratulations! Your e-commerce store is live! 🎉**
