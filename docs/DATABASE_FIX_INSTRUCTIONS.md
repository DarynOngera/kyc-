# Database Not Populating - Fix Instructions

## Issue
The database is not being populated because the `SUPABASE_SERVICE_ROLE_KEY` is missing from your environment variables.

## Quick Fix (3 Steps)

### Step 1: Get Your Service Role Key
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **API**
4. Find the **service_role** key
5. Click **"Reveal"** to see the key
6. Copy it (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 2: Add to Your .env File
Open your `.env` file and add this line (use your actual key):
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

### Step 3: Add Database Index
Run this SQL in your Supabase SQL Editor:
```sql
CREATE INDEX IF NOT EXISTS idx_transactions_checkout_request_id 
ON transactions(checkout_request_id);
```

### Step 4: Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Test It

1. Go to your checkout page
2. Initiate a payment
3. Check the logs - you should now see:
   ```
   Attempting to insert transaction record...
   Supabase URL configured: true
   Service Role Key configured: true  ← This should be TRUE now
   Anon Key configured: true
   ✅ Initial transaction record created successfully: [...]
   ```

4. Check your Supabase dashboard → Table Editor → `transactions` table
   - You should see a new row with `status = 'initiated'`

## What Was Wrong?

The code was using `SUPABASE_ANON_KEY` which is restricted by Row Level Security (RLS) policies. Backend functions need the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS and insert records.

## If You Still See Errors

After making the changes, run a test payment and check the logs. The improved error logging will now show you the exact error:

- **"new row violates row-level security policy"** → Service role key still not set correctly
- **"relation 'transactions' does not exist"** → Run the DATABASE_SCHEMA.sql in Supabase
- **"null value in column violates not-null constraint"** → Data validation issue

## For Production

Ensure `SUPABASE_SERVICE_ROLE_KEY` is available to the running server process (for example via systemd environment file or container secrets).

---

**Need help?** Check the logs after making these changes and share any error messages you see.
