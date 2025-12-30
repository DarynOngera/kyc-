# M-Pesa Daraja API Credentials Guide

## Current Issue: 400 Error - Invalid Credentials

Your server is working correctly, but the M-Pesa API is rejecting your credentials with a 400 error. This means the `MPESA_CONSUMER_KEY` and/or `MPESA_CONSUMER_SECRET` are incorrect.

## How to Get Valid M-Pesa Sandbox Credentials

### Step 1: Create a Daraja Account

1. Go to [Daraja Portal](https://developer.safaricom.co.ke/)
2. Click **Sign Up** (or **Login** if you already have an account)
3. Complete the registration process
4. Verify your email address

### Step 2: Create a Sandbox App

1. Login to the Daraja Portal
2. Go to **My Apps** in the navigation menu
3. Click **Create App** or **Add a new app**
4. Fill in the app details:
   - **App Name**: KejaYaCapo (or any name you prefer)
   - **Description**: E-commerce platform with M-Pesa integration
5. Select the APIs you need:
   - ✅ **Lipa Na M-Pesa Online (STK Push)** - This is what you need
   - You can also select others if needed
6. Click **Create App**

### Step 3: Get Your Credentials

After creating the app, you'll see:

1. **Consumer Key** - A long string (e.g., `xQM9kKl1234567890abcdefghijklmnop`)
2. **Consumer Secret** - Another long string (e.g., `AbCdEfGh1234567890`)

**Important Notes:**
- These are for **SANDBOX** environment (testing only)
- Do NOT use production credentials for testing
- Keep these credentials secret

### Step 4: Get Test Credentials for STK Push

For Lipa Na M-Pesa Online (STK Push), you also need:

1. **Business Short Code**: `174379` (default sandbox shortcode)
2. **Passkey**: You can find this in the **Test Credentials** section of your app

To find the passkey:
1. Go to your app in Daraja Portal
2. Click on **Lipa Na M-Pesa Online**
3. Look for **Test Credentials** section
4. Copy the **Passkey** (it's a long string)

### Step 5: Update Environment Variables

Update these variables with your NEW credentials:

```
MPESA_CONSUMER_KEY=<your_consumer_key_from_daraja>
MPESA_CONSUMER_SECRET=<your_consumer_secret_from_daraja>
MPESA_SHORTCODE=174379
MPESA_PASSKEY=<your_passkey_from_daraja>
MPESA_CALLBACK_URL=https://kejayacapo.shop/api/mpesa/callback
```

**Important:**
- Copy-paste the credentials exactly as shown (no extra spaces)
- Don't include quotes around the values
- Make sure there are no line breaks in the middle of the credentials

### Step 6: Verify Your Credentials

After updating, restart your server and run an STK push test; verify your callback endpoint is publicly reachable.

## Common Issues

### ❌ 400 Error: Invalid Credentials
**Cause**: Wrong Consumer Key or Consumer Secret
**Solution**: 
- Double-check you copied the credentials correctly from Daraja Portal
- Make sure you're using SANDBOX credentials, not production
- Ensure there are no extra spaces before or after the credentials

### ❌ Credentials Not Found
**Cause**: Environment variables not set
**Solution**: Add them to your `.env` (local) or your server environment (production)

### ❌ App Not Created
**Cause**: You need to create an app in Daraja Portal first
**Solution**: Follow Step 2 above

## Testing with Sandbox

Once configured correctly:
1. Use test phone numbers in format: `254XXXXXXXXX`
2. You can use any valid Kenyan phone number for testing
3. In sandbox, you won't receive actual M-Pesa prompts
4. Check the response codes to verify the integration works

## Moving to Production

When ready for production:
1. Create a **Production App** in Daraja Portal
2. Get production credentials
3. Use your actual **Business Till Number** or **Paybill Number**
4. Update environment variables with production credentials
5. Test thoroughly before going live

## Need Help?

- [Daraja API Documentation](https://developer.safaricom.co.ke/Documentation)
- [Daraja Support](https://developer.safaricom.co.ke/support)
- Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) guide

## Quick Checklist

- [ ] Created account on Daraja Portal
- [ ] Created a Sandbox App
- [ ] Copied Consumer Key
- [ ] Copied Consumer Secret
- [ ] Got the Passkey from Test Credentials
- [ ] Updated all environment variables in your server environment
- [ ] Verified no extra spaces in credentials
- [ ] Restarted the server after env changes
- [ ] Tested the payment flow
