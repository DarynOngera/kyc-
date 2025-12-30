# Supabase Setup Guide - Step by Step

## 🎯 Overview

Complete guide to setting up Supabase for KejaYaCapo e-commerce system.

---

## 📋 Step 1: Create Supabase Project (5 minutes)

### **1.1 Sign Up / Login**
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email

### **1.2 Create New Project**
1. Click **"New Project"**
2. Select your organization (or create one)
3. Fill in project details:
   ```
   Name: kejayacapo-production
   Database Password: [Generate strong password - SAVE THIS!]
   Region: Choose closest to Kenya (e.g., Singapore, Frankfurt)
   Pricing Plan: Free (sufficient to start)
   ```
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

---

## 📊 Step 2: Run Database Schema (5 minutes)

### **2.1 Open SQL Editor**
1. In your Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"New query"**

### **2.2 Copy Schema**
1. Open `DATABASE_SCHEMA.sql` from your project
2. Copy **ALL** contents (entire file)

### **2.3 Execute Schema**
1. Paste into SQL Editor
2. Click **"Run"** (or press Ctrl/Cmd + Enter)
3. Wait for success message: ✅ "Success. No rows returned"

### **2.4 Verify Tables Created**
1. Click **"Table Editor"** in left sidebar
2. You should see these tables:
   - ✅ users
   - ✅ transactions
   - ✅ cart_items
   - ✅ products
   - ✅ orders
   - ✅ order_items

---

## 🔐 Step 3: Configure Row Level Security (3 minutes)

### **3.1 Check RLS Status**
1. Go to **"Authentication"** → **"Policies"**
2. Verify RLS is enabled on all tables

### **3.2 Verify Policies**
The schema already includes these policies:
- ✅ Users can read their own data
- ✅ Users can update their own profile
- ✅ Users can manage their own cart
- ✅ Service role has full access (server-side)

### **3.3 Test Policies**
Run this query in SQL Editor:
```sql
-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

All tables should show `rowsecurity = true`

---

## 🔑 Step 4: Get API Credentials (2 minutes)

### **4.1 Get Project URL**
1. Click **"Settings"** (gear icon) in left sidebar
2. Click **"API"**
3. Find **"Project URL"**
   ```
   Example: https://abcdefghijklmnop.supabase.co
   ```
4. **Copy this** - you'll need it for environment variables

### **4.2 Get API Keys**
In the same API settings page:

1. **anon/public key** (for client-side)
   ```
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Click **"Copy"** next to `anon` `public`
   - This is safe to use in frontend

2. **service_role key** (for server-side)
   ```
   Starts with: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   - Click **"Reveal"** then **"Copy"** next to `service_role` `secret`
   - ⚠️ **KEEP THIS SECRET** - never expose in frontend

---

## 🌐 Step 5: Update Environment Variables (5 minutes)

### **5.1 Local Development (.env)**
Create `.env` file in project root:
```bash
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key

# Resend (Email)
RESEND_API_KEY=re_your_resend_key
FROM_EMAIL=orders@kejayacapo.shop
ADMIN_EMAIL=admin@kejayacapo.shop

# JWT
JWT_SECRET=your-32-character-secret-key

# M-Pesa
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=http://localhost:3000/api/mpesa/callback
```

### **5.2 Production**
1. Go to your production environment
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `ADMIN_EMAIL`
   - `JWT_SECRET`
   - `MPESA_CONSUMER_KEY`
   - `MPESA_CONSUMER_SECRET`
   - `MPESA_SHORTCODE`
   - `MPESA_PASSKEY`
   - `MPESA_CALLBACK_URL`

---

## 🧪 Step 6: Test Database Connection (5 minutes)

### **6.1 Test from Supabase Dashboard**

Run these test queries in SQL Editor:

**Test 1: Create Test User**
```sql
INSERT INTO users (email, password_hash, full_name, phone_number)
VALUES (
  'test@example.com',
  '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
  'Test User',
  '254712345678'
)
RETURNING *;
```

**Test 2: View Users**
```sql
SELECT * FROM users;
```

**Test 3: Create Test Transaction**
```sql
INSERT INTO transactions (
  checkout_request_id,
  merchant_request_id,
  phone_number,
  amount,
  status
) VALUES (
  'ws_CO_12345678',
  'mr_12345678',
  '254712345678',
  1000,
  'initiated'
)
RETURNING *;
```

**Test 4: View Transactions**
```sql
SELECT * FROM transactions;
```

**Test 5: Use Transaction Summary View**
```sql
SELECT * FROM transaction_summaries LIMIT 5;
```

### **6.2 Test from Your Application**

**Local Test:**
```bash
# Start Express server
npm run dev
 
 # In another terminal, test signup
 curl -X POST http://localhost:3000/api/auth/signup \
   -H "Content-Type: application/json" \
   -d '{
     "email": "test2@example.com",
    "password": "TestPass123",
    "fullName": "Test User 2",
    "phoneNumber": "254712345679"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User created successfully"
}
```

---

## 🔍 Step 7: Verify Setup (3 minutes)

### **7.1 Check Tables**
In Supabase **Table Editor**, verify:
- [ ] All 6 tables exist
- [ ] Tables have correct columns
- [ ] RLS is enabled on all tables

### **7.2 Check Policies**
In **Authentication** → **Policies**:
- [ ] Users table has policies
- [ ] Transactions table has policies
- [ ] Cart_items table has policies

### **7.3 Check Functions**
In **SQL Editor**, run:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

Should show: `update_updated_at_column`

### **7.4 Check Indexes**
```sql
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

Should show indexes on:
- users.email
- transactions.checkout_request_id
- transactions.mpesa_receipt

---

## 📊 Step 8: Populate Test Data (Optional)

### **8.1 Add Sample Products**
```sql
INSERT INTO products (name, description, price, image_url, category, stock_quantity)
VALUES 
  ('KejaYaCapo RALLY', 'Premium rally t-shirt', 2500, '/assets/products/rally-brown-back.jpg', 'apparel', 50),
  ('Wakadinali T-Shirt', 'Official Wakadinali merch', 2000, '/assets/products/wakadinali-white.jpg', 'apparel', 30),
  ('Wangari Maathai', 'Tribute t-shirt', 2200, '/assets/products/wangari-neon-green.jpg', 'apparel', 40);
```

### **8.2 Verify Products**
```sql
SELECT * FROM products WHERE is_active = true;
```

---

## 🚨 Troubleshooting

### **Issue: "relation does not exist"**
**Solution:** Schema not run properly
```sql
-- Drop all tables and re-run schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then run DATABASE_SCHEMA.sql again
```

### **Issue: "permission denied"**
**Solution:** Check RLS policies
```sql
-- Temporarily disable RLS for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- Re-enable after testing
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### **Issue: "invalid API key"**
**Solution:** 
1. Verify you copied the correct key
2. Check for extra spaces
3. Regenerate key in Supabase dashboard

### **Issue: Connection timeout**
**Solution:**
1. Check your internet connection
2. Verify Supabase project is active
3. Check region/firewall settings

---

## 🔐 Security Best Practices

### **1. API Keys**
- ✅ Use `anon` key for frontend
- ✅ Use `service_role` key only in backend
- ✅ Never commit keys to git
- ✅ Rotate keys periodically

### **2. Row Level Security**
- ✅ Keep RLS enabled on all tables
- ✅ Test policies thoroughly
- ✅ Use service_role only in trusted functions

### **3. Database Access**
- ✅ Use prepared statements (Supabase does this)
- ✅ Validate all inputs
- ✅ Limit query results with `.limit()`

---

## 📈 Monitoring & Maintenance

### **Daily Checks**
1. **Database Usage**
   - Dashboard → Settings → Usage
   - Monitor rows, storage, bandwidth

2. **Active Connections**
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

3. **Recent Transactions**
   ```sql
   SELECT * FROM transaction_summaries LIMIT 10;
   ```

### **Weekly Tasks**
1. Backup database (automatic in Supabase)
2. Review error logs
3. Check slow queries
4. Monitor growth trends

### **Monthly Tasks**
1. Rotate API keys
2. Review and optimize indexes
3. Archive old data
4. Update documentation

---

## 📚 Useful Queries

### **User Statistics**
```sql
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE is_active = true) as active_users,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_this_week
FROM users;
```

### **Transaction Statistics**
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM transactions
GROUP BY status;
```

### **Top Customers**
```sql
SELECT 
  u.full_name,
  u.email,
  COUNT(t.id) as transaction_count,
  SUM(t.amount) as total_spent
FROM users u
JOIN transactions t ON u.id = t.user_id
WHERE t.status = 'completed'
GROUP BY u.id, u.full_name, u.email
ORDER BY total_spent DESC
LIMIT 10;
```

### **Recent Orders**
```sql
SELECT 
  o.order_number,
  u.full_name,
  o.total_amount,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 20;
```

---

## ✅ Setup Complete Checklist

- [ ] Supabase project created
- [ ] Database schema executed
- [ ] All 6 tables exist
- [ ] RLS enabled and policies active
- [ ] API credentials copied
- [ ] Environment variables set (local)
- [ ] Environment variables set (production)
- [ ] Test user created successfully
- [ ] Test transaction created successfully
- [ ] Connection tested from application
- [ ] Sample products added (optional)

---

## 🎉 Next Steps

After completing setup:

1. **Test Authentication**
   - Visit `/signup.html`
   - Create a test account
   - Verify in Supabase Table Editor

2. **Test Transaction Flow**
   - Add items to cart
   - Proceed to checkout
   - Initiate M-Pesa payment (sandbox)
   - Verify transaction logged

3. **Monitor Logs**
   - Server logs
   - Supabase logs (Dashboard → Logs)

4. **Go Live**
   - Switch M-Pesa to production
   - Update callback URL
   - Test complete flow
   - Monitor for 24 hours

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **SQL Reference:** https://www.postgresql.org/docs/

---

**Setup Time:** ~25 minutes  
**Difficulty:** Easy  
**Status:** Ready to Deploy ✅
