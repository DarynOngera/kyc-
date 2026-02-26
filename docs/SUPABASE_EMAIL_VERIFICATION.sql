-- Email verification fields for users table
-- Run in Supabase SQL Editor

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verification_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMPTZ;

-- Default new users to inactive until verification
ALTER TABLE public.users
  ALTER COLUMN is_active SET DEFAULT FALSE;

-- Optional: index for verification lookup
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token_hash
  ON public.users (email_verification_token_hash);

-- Optional: backfill existing rows (keep existing users active)
UPDATE public.users
SET is_active = TRUE
WHERE is_active IS DISTINCT FROM TRUE;
