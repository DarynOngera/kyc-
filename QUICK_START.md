# Quick Start Guide - KejaYaCapo E-commerce

## 🚀 Get Started in 5 Steps

### Step 1: Install Dependencies (2 minutes)
```bash
cd /home/ongera/projects/kyc/duka-replica
npm install
```

### Step 2: Set Up Supabase Database (5 minutes)
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Copy Project URL and anon key
3. In Supabase dashboard → SQL Editor
4. Copy & paste contents of `DATABASE_SCHEMA.sql`
5. Click "Run" to create all tables

### Step 3: Set Up Resend Email Service (3 minutes)
1. Go to [resend.com](https://resend.com) → Sign up
2. Add domain `kejayacapo.shop` OR use test domain
3. Create API key
4. Copy API key

### Step 4: Configure Environment Variables (5 minutes)
In Netlify dashboard → Site Settings → Environment Variables, add:

```bash
# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=orders@kejayacapo.shop
ADMIN_EMAIL=admin@kejayacapo.shop

# Auth
JWT_SECRET=your-32-character-secret-key

# M-Pesa (existing)
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://kejayacapo.shop/.netlify/functions/mpesa-callback
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Deploy (2 minutes)
```bash
git add .
git commit -m "Add authentication and transaction system"
git push
```

Netlify will automatically deploy!

---

## ✅ Test Your System

### 1. Create Test Account
Visit: `https://kejayacapo.shop/signup.html`
```
Email: test@example.com
Password: TestPass123
Name: Test User
Phone: 254712345678
```

### 2. Login
Visit: `https://kejayacapo.shop/login.html`
- Use credentials from step 1
- Should redirect to shop

### 3. Make Test Purchase
1. Browse products at `/duka.html`
2. Add items to cart
3. Click "Proceed to Checkout"
4. Should go directly to checkout (already logged in)
5. Initiate M-Pesa payment
6. Check email for confirmation

### 4. Verify Database
In Supabase → Table Editor:
- Check `users` table for new user
- Check `transactions` table for payment record

---

## 📱 User Flow

### New Customer Journey
```
1. Browse products → Add to cart
2. Click "Proceed to Checkout"
3. See "Sign In Required" modal 🔒
4. Click "Sign Up"
5. Create account
6. Redirected to checkout
7. Complete payment
8. Receive email confirmation ✉️
```

### Returning Customer Journey
```
1. Browse products → Add to cart
2. Click "Proceed to Checkout"
3. See "Sign In Required" modal 🔒
4. Click "Sign In"
5. Enter credentials
6. Redirected to checkout
7. Complete payment
8. Receive email confirmation ✉️
```

### Already Logged In
```
1. Browse products → Add to cart
2. Click "Proceed to Checkout"
3. Go directly to checkout (no modal)
4. Complete payment
5. Receive email confirmation ✉️
```

---

## 🔑 Key Features

### ✅ Authentication System
- Email-based signup/login
- JWT token authentication
- Password hashing (bcrypt)
- Session management
- Automatic redirects

### ✅ Transaction Logging
- All M-Pesa payments logged
- Success and failure tracking
- Complete audit trail
- User linkage

### ✅ Email Notifications
- Customer order confirmations
- Admin new order alerts
- Professional HTML templates
- M-Pesa receipt numbers

### ✅ Security
- Passwords hashed with bcrypt
- JWT tokens (7-day expiry)
- Input validation
- SQL injection protection
- CORS protection

---

## 📁 Important Files

### Backend Functions
- `netlify/functions/auth-signup.js` - User registration
- `netlify/functions/auth-login.js` - User login
- `netlify/functions/mpesa-callback.js` - Payment processing
- `netlify/functions/utils/supabase.js` - Database client
- `netlify/functions/utils/email.js` - Email service

### Frontend Pages
- `login.html` - Login page
- `signup.html` - Registration page
- `cart.html` - Shopping cart (with auth modal)
- `checkout.html` - Checkout (requires auth)

### Documentation
- `AUTHENTICATION_SETUP_GUIDE.md` - Detailed setup
- `AUTHENTICATION_FLOW.md` - User flow documentation
- `IMPLEMENTATION_SUMMARY.md` - System overview
- `DATABASE_SCHEMA.sql` - Database structure

---

## 🗄️ Database Tables

1. **users** - User accounts
2. **transactions** - M-Pesa payments
3. **cart_items** - Shopping carts
4. **products** - Product catalog
5. **orders** - Completed orders
6. **order_items** - Order details

---

## 🔍 Monitoring

### View Transactions
Supabase → Table Editor → `transactions`

### View Users
Supabase → Table Editor → `users`

### Check Logs
Netlify → Functions → Click function name

### Email Status
Resend → Emails tab

---

## 🆘 Troubleshooting

### "Supabase credentials not configured"
✅ Check environment variables in Netlify
✅ Verify SUPABASE_URL and SUPABASE_ANON_KEY

### "Failed to send email"
✅ Verify RESEND_API_KEY is correct
✅ Check domain is verified in Resend
✅ Ensure FROM_EMAIL matches verified domain

### "User not found"
✅ Verify user exists in database
✅ Check phone number format (254...)

### Modal not showing
✅ Check browser console for errors
✅ Verify authModal element exists in HTML
✅ Clear browser cache

---

## 📚 Documentation

- **Setup Guide**: `AUTHENTICATION_SETUP_GUIDE.md`
- **User Flow**: `AUTHENTICATION_FLOW.md`
- **System Overview**: `IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `DATABASE_SCHEMA.sql`
- **Domain Setup**: `CUSTOM_DOMAIN_SETUP_GUIDE.md`
- **SEO Guide**: `SEO_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 What's Next?

### Immediate
- [ ] Deploy to production
- [ ] Test complete flow
- [ ] Verify emails working

### Short-term
- [ ] Add user dashboard
- [ ] Create admin panel
- [ ] Add order tracking

### Future
- [ ] Email verification
- [ ] Password reset
- [ ] Social login
- [ ] Analytics dashboard

---

## 💡 Pro Tips

1. **Test in sandbox first** - Use M-Pesa sandbox before going live
2. **Monitor logs** - Check Netlify function logs regularly
3. **Backup database** - Export Supabase data weekly
4. **Update secrets** - Rotate JWT secret periodically
5. **Check emails** - Test email delivery before launch

---

## 📞 Support

### Resources
- Supabase Docs: https://supabase.com/docs
- Resend Docs: https://resend.com/docs
- Netlify Docs: https://docs.netlify.com

### Common Issues
Check the troubleshooting section in `AUTHENTICATION_SETUP_GUIDE.md`

---

**Last Updated:** 2025-10-17  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

---

## 🎉 You're All Set!

Your authentication and transaction system is ready to go. Follow the steps above to deploy and start accepting orders!
