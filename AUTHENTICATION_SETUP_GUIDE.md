# Authentication & Transaction System Setup Guide

## Overview
This guide will help you set up the complete authentication, transaction logging, and email notification system for KejaYaCapo.

## System Components

1. **Supabase** - Database for users, transactions, and cart
2. **Resend** - Email service for customer and admin notifications
3. **JWT** - Secure token-based authentication
4. **M-Pesa Integration** - Payment processing with automatic logging

---

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up or log in
4. Click "New Project"
5. Fill in:
   - **Name**: `kejayacapo-db`
   - **Database Password**: (Generate a strong password and save it)
   - **Region**: Choose closest to Kenya (e.g., Singapore or Frankfurt)
6. Click "Create new project" (takes ~2 minutes)

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `DATABASE_SCHEMA.sql`
4. Paste into the SQL editor
5. Click "Run" or press `Ctrl+Enter`
6. Verify all tables were created successfully

### 1.3 Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)

---

## Step 2: Resend Setup (Email Service)

### 2.1 Create Resend Account

1. Go to [https://resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email

### 2.2 Add Domain (Recommended)

1. In Resend dashboard, go to **Domains**
2. Click "Add Domain"
3. Enter: `kejayacapo.shop`
4. Follow DNS configuration instructions:
   - Add the provided DNS records to your domain registrar
   - Wait for verification (usually 5-15 minutes)

**OR use Resend's test domain** (for development):
- You can send emails from `onboarding@resend.dev` without domain setup
- Limited to 100 emails/day

### 2.3 Get API Key

1. Go to **API Keys**
2. Click "Create API Key"
3. Name it: `kejayacapo-production`
4. Copy the API key (starts with `re_...`)
5. **Save it securely** - you won't see it again!

---

## Step 3: Configure Netlify Environment Variables

1. Go to your Netlify dashboard
2. Select your site (duka-replica)
3. Go to **Site settings** → **Environment variables**
4. Add the following variables:

### Database Variables
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Email Variables
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
FROM_EMAIL=orders@kejayacapo.shop
ADMIN_EMAIL=admin@kejayacapo.shop
```

### Authentication Variable
```
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
```
**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Existing M-Pesa Variables (keep these)
```
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://kejayacapo.shop/.netlify/functions/mpesa-callback
```

---

## Step 4: Install Dependencies

Run this command in your project directory:

```bash
npm install
```

This will install:
- `@supabase/supabase-js` - Database client
- `resend` - Email service
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens

---

## Step 5: Deploy to Netlify

### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Add authentication and transaction system"
git push
```

Netlify will automatically deploy.

### Option B: Manual Deploy
```bash
netlify deploy --prod
```

---

## Step 6: Test the System

### 6.1 Test User Signup

```bash
curl -X POST https://kejayacapo.shop/.netlify/functions/auth-signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "fullName": "Test User",
    "phoneNumber": "254712345678"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "id": "uuid",
    "email": "test@example.com",
    "full_name": "Test User",
    "phone_number": "254712345678"
  }
}
```

### 6.2 Test User Login

```bash
curl -X POST https://kejayacapo.shop/.netlify/functions/auth-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### 6.3 Test Transaction Flow

1. User signs up/logs in
2. User adds items to cart
3. User initiates M-Pesa payment
4. M-Pesa callback is received
5. Transaction is logged to database
6. Emails are sent to customer and admin
7. Cart is cleared

---

## API Endpoints

### Authentication
- **POST** `/.netlify/functions/auth-signup` - Create new user
- **POST** `/.netlify/functions/auth-login` - User login

### Payments
- **POST** `/.netlify/functions/mpesa-payment` - Initiate M-Pesa payment
- **POST** `/.netlify/functions/mpesa-callback` - M-Pesa callback (automatic)

---

## Database Tables

### `users`
- User accounts with email authentication
- Stores: email, password_hash, full_name, phone_number

### `transactions`
- All M-Pesa transactions (successful and failed)
- Stores: mpesa_receipt, amount, phone_number, status, etc.

### `cart_items`
- User shopping cart items
- Links users to products with quantities

### `products`
- Product catalog
- Stores: name, description, price, image_url, stock

### `orders`
- Completed orders
- Links transactions to order details

### `order_items`
- Individual items in each order
- Stores product snapshot at time of purchase

---

## Email Templates

### Customer Email
- Order confirmation with receipt number
- Itemized list of products
- Total amount and payment details
- Professional KejaYaCapo branding

### Admin Email
- New order notification
- Customer information
- Payment details
- Action required notice

---

## Security Features

✅ **Password Hashing** - bcrypt with salt rounds  
✅ **JWT Tokens** - Secure, expiring tokens  
✅ **Input Validation** - Email, phone, password strength  
✅ **SQL Injection Protection** - Parameterized queries  
✅ **Row Level Security** - Supabase RLS policies  
✅ **CORS Protection** - Configured headers  

---

## Monitoring & Logs

### View Transactions
1. Go to Supabase dashboard
2. Navigate to **Table Editor** → **transactions**
3. View all transactions with status, amounts, receipts

### View Users
1. **Table Editor** → **users**
2. See all registered users

### Check Logs
1. Netlify dashboard → **Functions**
2. Click on function name
3. View real-time logs

### Email Logs
1. Resend dashboard → **Emails**
2. View all sent emails, delivery status, opens

---

## Troubleshooting

### Issue: "Supabase credentials not configured"
**Solution:** Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Netlify environment variables

### Issue: "Failed to send email"
**Solution:** 
- Verify `RESEND_API_KEY` is correct
- Check domain is verified in Resend
- Ensure `FROM_EMAIL` matches verified domain

### Issue: "Invalid email or password"
**Solution:**
- Verify user exists in database
- Check password meets minimum requirements (8 characters)

### Issue: "Transaction not logged"
**Solution:**
- Check M-Pesa callback is reaching your server
- Verify callback URL in M-Pesa dashboard
- Check Supabase connection

---

## Next Steps

1. ✅ Create login/signup UI pages
2. ✅ Update checkout to require authentication
3. ✅ Add user dashboard to view orders
4. ✅ Create admin panel for order management
5. ✅ Add email verification (optional)
6. ✅ Implement password reset (optional)

---

## Support

For issues or questions:
- Check Netlify function logs
- Review Supabase logs
- Check Resend email logs
- Verify all environment variables are set correctly

---

**Last Updated:** 2025-10-17  
**Version:** 1.0.0
