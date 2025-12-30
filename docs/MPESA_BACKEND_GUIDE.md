# M-Pesa Daraja API Backend Implementation Guide

## ⚠️ IMPORTANT SECURITY NOTICE

**DO NOT expose your M-Pesa credentials in the frontend!**

The current implementation uses sandbox credentials for demonstration. For production, you MUST implement a secure backend.

## Required Backend Endpoints

### 1. Get Access Token Endpoint

**Endpoint:** `POST /api/mpesa/token`

**Purpose:** Securely generate and return M-Pesa access token

**Implementation (Node.js/Express example):**

```javascript
const express = require('express');
const axios = require('axios');

app.post('/api/mpesa/token', async (req, res) => {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    try {
        const response = await axios.get(
            'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
            {
                headers: {
                    'Authorization': `Basic ${auth}`
                }
            }
        );
        
        res.json({ token: response.data.access_token });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get token' });
    }
});
```

### 2. Initiate Payment Endpoint

**Endpoint:** `POST /api/mpesa/payment`

**Purpose:** Securely initiate STK Push from backend

**Request Body:**
```json
{
    "phoneNumber": "254708374149",
    "amount": 1000,
    "accountReference": "Order123"
}
```

**Implementation:**

```javascript
app.post('/api/mpesa/payment', async (req, res) => {
    const { phoneNumber, amount, accountReference } = req.body;
    
    // Get access token
    const token = await getAccessToken();
    
    // Generate timestamp and password
    const timestamp = generateTimestamp();
    const password = generatePassword(timestamp);
    
    const requestBody = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: phoneNumber,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: "Payment for order"
    };
    
    try {
        const response = await axios.post(
            'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Payment failed' });
    }
});
```

### 3. Callback Endpoint

**Endpoint:** `POST /api/mpesa/callback`

**Purpose:** Receive payment confirmation from Safaricom

**Implementation:**

```javascript
app.post('/api/mpesa/callback', async (req, res) => {
    const { Body } = req.body;
    
    if (Body.stkCallback.ResultCode === 0) {
        // Payment successful
        const metadata = Body.stkCallback.CallbackMetadata.Item;
        
        // Extract payment details
        const amount = metadata.find(item => item.Name === 'Amount').Value;
        const mpesaReceiptNumber = metadata.find(item => item.Name === 'MpesaReceiptNumber').Value;
        const phoneNumber = metadata.find(item => item.Name === 'PhoneNumber').Value;
        
        // Update order status in database
        await updateOrderStatus({
            receipt: mpesaReceiptNumber,
            amount,
            phoneNumber,
            status: 'paid'
        });
        
        console.log('Payment successful:', mpesaReceiptNumber);
    } else {
        // Payment failed
        console.log('Payment failed:', Body.stkCallback.ResultDesc);
    }
    
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
});
```

## Environment Variables

Create a `.env` file with:

```env
# Production Credentials
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# Sandbox Credentials (for testing)
MPESA_SANDBOX_CONSUMER_KEY=sandbox_key
MPESA_SANDBOX_CONSUMER_SECRET=sandbox_secret
MPESA_SANDBOX_SHORTCODE=174379
MPESA_SANDBOX_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
```

## Frontend Updates Required

Update `checkout.js` to use backend endpoints:

```javascript
const MPESA_CONFIG = {
    getAccessToken: async function() {
        const response = await fetch('/api/mpesa/token', {
            method: 'POST'
        });
        const data = await response.json();
        return data.token;
    }
};

async function initiateMpesaPayment(phoneNumber, amount, accountReference) {
    const response = await fetch('/api/mpesa/payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            phoneNumber,
            amount,
            accountReference
        })
    });
    
    return await response.json();
}
```

## Testing with Sandbox

1. Use test credentials from Daraja Portal
2. Test phone numbers: 254708374149, 254708374150, etc.
3. Use amount: 1 (minimum for testing)
4. Monitor callback responses

## Production Checklist

- [ ] Move all credentials to environment variables
- [ ] Implement secure backend endpoints
- [ ] Set up SSL/HTTPS for callback URL
- [ ] Register production callback URL with Safaricom
- [ ] Implement proper error handling
- [ ] Add payment logging and monitoring
- [ ] Implement order status tracking
- [ ] Add payment confirmation emails
- [ ] Test thoroughly in sandbox before going live
- [ ] Apply for production credentials from Safaricom

## Additional Resources

- [Daraja API Documentation](https://developer.safaricom.co.ke/)
- [STK Push API Guide](https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate)
- [Callback URL Setup](https://developer.safaricom.co.ke/docs#lipa-na-m-pesa-online-query-request)
