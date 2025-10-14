# Deploy to Netlify via GitHub (Automatic Deployments)

This is the **recommended approach** - every time you push to GitHub, Netlify automatically deploys!

## 🚀 Step-by-Step Guide

### Step 1: Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit - KejaYaCapo Duka with M-Pesa"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `kejayacapo-duka` (or whatever you want)
3. Keep it **Private** (recommended - contains business logic)
4. **DO NOT** initialize with README (you already have files)
5. Click "Create repository"

### Step 3: Push to GitHub

GitHub will show you commands like this:

```bash
git remote add origin https://github.com/YOUR_USERNAME/kejayacapo-duka.git
git branch -M main
git push -u origin main
```

Copy and run those commands in your terminal.

### Step 4: Connect to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select your repository: `kejayacapo-duka`

### Step 5: Configure Build Settings

On the deploy settings page:

- **Branch to deploy**: `main`
- **Build command**: (leave empty)
- **Publish directory**: `.`
- **Functions directory**: `netlify/functions` (should auto-detect)

Click **"Deploy site"**

### Step 6: Add Environment Variables

In Netlify dashboard:

1. Go to **Site settings** → **Environment variables**
2. Click **"Add a variable"** and add each one:

| Key | Value |
|-----|-------|
| `MPESA_CONSUMER_KEY` | `BntxdAmlpX0pDhi2EQT5UD6hbSv8EwRQAH4cZJoyFwei5jGY` |
| `MPESA_CONSUMER_SECRET` | `DySNrg18kEZAaAoX9bP9ZVkLIZW7EB1s8oJGXepI3HJVBNLl0TlGrW0FIe1zxyh3` |
| `MPESA_SHORTCODE` | `174379` |
| `MPESA_PASSKEY` | `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` |

3. Click **"Save"**

### Step 7: Trigger Redeploy

After adding environment variables:

1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**

### Step 8: Get Your Callback URL

After deployment completes, you'll get a URL like:
```
https://random-name-123.netlify.app
```

Or if you set a custom name:
```
https://kejayacapo-duka.netlify.app
```

Add the callback URL as an environment variable:

1. **Site settings** → **Environment variables**
2. Add new variable:
   - Key: `MPESA_CALLBACK_URL`
   - Value: `https://your-site-name.netlify.app/.netlify/functions/mpesa-callback`
3. **Trigger deploy** again

---

## ✅ Done!

Your site is now live and will **auto-deploy** every time you push to GitHub!

---

## 🔄 Making Updates

Just commit and push:

```bash
git add .
git commit -m "Updated product images"
git push
```

Netlify automatically deploys! 🎉

---

## 🎨 Custom Domain (Optional)

### Free Netlify Subdomain

1. **Site settings** → **Domain management**
2. Click **"Options"** → **"Edit site name"**
3. Change to: `kejayacapo-duka`
4. Your site: `https://kejayacapo-duka.netlify.app`

### Your Own Domain

1. Buy domain (Namecheap, GoDaddy, etc.)
2. **Domain management** → **"Add custom domain"**
3. Follow DNS setup instructions
4. Free SSL automatically enabled!

---

## 📊 Monitor Deployments

### View Deploy Status

- **Deploys** tab shows all deployments
- Green ✅ = Success
- Red ❌ = Failed (click for logs)

### View Function Logs

1. **Functions** tab
2. Click on `mpesa-payment` or `mpesa-callback`
3. View real-time logs

---

## 🐛 Troubleshooting

### Build Failed
- Check **Deploy log** for errors
- Verify `netlify.toml` is in root
- Ensure `netlify/functions/` folder exists

### Functions Not Working
- Verify environment variables are set
- Check function logs for errors
- Ensure `axios` is in `package.json` dependencies

### Environment Variables Not Loading
- After adding variables, **trigger a new deploy**
- Variables only load on new deployments

---

## 🔐 Security Best Practices

✅ **DO:**
- Keep repository private (if it contains business logic)
- Use environment variables for all secrets
- Add `.env` to `.gitignore` (already done)
- Regularly update dependencies

❌ **DON'T:**
- Commit `.env` file to GitHub
- Hardcode API keys in code
- Make repository public with credentials

---

## 📚 Useful Netlify Features

### Deploy Previews
- Every pull request gets a preview URL
- Test changes before merging

### Branch Deploys
- Deploy specific branches
- Great for staging environments

### Rollbacks
- Instantly rollback to previous deployment
- **Deploys** → Click old deploy → **"Publish deploy"**

### Analytics
- See visitor stats
- **Analytics** tab (may require paid plan)

---

## 🎯 Next Steps

1. ✅ Push code to GitHub
2. ✅ Connect to Netlify
3. ✅ Add environment variables
4. ✅ Deploy!
5. ⏳ Test M-Pesa payment flow
6. ⏳ Add custom domain (optional)
7. ⏳ Set up production M-Pesa credentials

---

## 💡 Pro Tips

### Protect Main Branch
In GitHub:
1. **Settings** → **Branches**
2. Add rule for `main`
3. Require pull request reviews

### Auto-Deploy Branches
In Netlify:
1. **Site settings** → **Build & deploy**
2. **Branch deploys** → **"Let me add individual branches"**
3. Add `staging` or `dev` branches

### Notifications
1. **Site settings** → **Build & deploy** → **Deploy notifications**
2. Add Slack, email, or webhook notifications

---

## 🆘 Need Help?

- [Netlify Docs](https://docs.netlify.com)
- [Netlify Support](https://www.netlify.com/support/)
- [Community Forum](https://answers.netlify.com)

---

## 🎉 You're All Set!

Your site will now:
- ✅ Auto-deploy on every push
- ✅ Run M-Pesa functions serverlessly
- ✅ Scale automatically
- ✅ Have free SSL
- ✅ Be globally distributed

Happy deploying! 🚀
