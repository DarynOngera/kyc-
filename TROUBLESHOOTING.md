# Troubleshooting Guide

## 500 Internal Server Error

If you're experiencing a 500 error when testing M-Pesa payments, follow these steps:

### 1. Check Environment Variables

The most common cause of 500 errors is missing environment variables. Ensure you have configured:

**For Netlify Deployment:**
Go to Netlify Dashboard → Site Settings → Environment Variables and add:

```
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-site.netlify.app/.netlify/functions/mpesa-callback
```

**For Local Development:**
Create a `.env` file in the project root:

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=http://localhost:8888/.netlify/functions/mpesa-callback
```

### 2. Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

### 3. Check Netlify Function Logs

To see detailed error messages:

1. Go to Netlify Dashboard
2. Navigate to Functions tab
3. Click on the `mpesa-payment` function
4. View the logs to see the exact error

### 4. Test Locally

Test the serverless function locally using Netlify CLI:

```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Run local development server
netlify dev
```

This will start a local server at `http://localhost:8888` that simulates the Netlify environment.

### 5. Common Error Messages

#### "M-Pesa credentials not configured"
- **Solution**: Add `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET` to your environment variables

#### "Failed to get access token"
- **Solution**: Verify your M-Pesa API credentials are correct
- Check if you're using sandbox credentials for testing

#### "Invalid request body"
- **Solution**: Ensure the request is sending valid JSON with `phoneNumber` and `amount` fields

#### "CORS error"
- **Solution**: This is already handled in the serverless function. If you still see CORS errors, check browser console for details

### 6. Verify M-Pesa Credentials

Test your M-Pesa credentials directly:

```bash
# Test getting access token
curl -X GET "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic $(echo -n 'CONSUMER_KEY:CONSUMER_SECRET' | base64)"
```

Replace `CONSUMER_KEY` and `CONSUMER_SECRET` with your actual credentials.

### 7. Check Network Tab

Open browser DevTools → Network tab and:
1. Filter by `mpesa-payment`
2. Click on the failed request
3. Check the Response tab for error details
4. Check the Preview tab for formatted error message

### 8. Enable Detailed Logging

The updated serverless function now includes detailed error logging. Check:
- Netlify function logs for server-side errors
- Browser console for client-side errors

### 9. Redeploy After Changes

After updating environment variables or code:

```bash
# Commit changes
git add .
git commit -m "Fix: Update M-Pesa configuration"
git push

# Or redeploy manually in Netlify Dashboard
```

### 10. Contact Support

If the issue persists:
1. Check Safaricom Daraja API status
2. Review the [Daraja API documentation](https://developer.safaricom.co.ke/)
3. Contact Safaricom support for API-specific issues

## Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Safaricom Daraja API Docs](https://developer.safaricom.co.ke/Documentation)
- [M-Pesa Integration Guide](./MPESA_BACKEND_GUIDE.md)
