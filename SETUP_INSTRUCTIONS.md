# M-Pesa Integration Setup Instructions

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `express` - Web server framework
- `cors` - Enable cross-origin requests
- `axios` - HTTP client for API calls
- `dotenv` - Environment variable management

### 2. Configure Environment Variables

Your `.env` file is already set up with sandbox credentials:

```env
MPESA_CONSUMER_KEY=BntxdAmlpX0pDhi2EQT5UD6hbSv8EwRQAH4cZJoyFwei5jGY
MPESA_CONSUMER_SECRET=DySNrg18kEZAaAoX9bP9ZVkLIZW7EB1s8oJGXepI3HJVBNLl0TlGrW0FIe1zxyh3
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback
```

### 3. Start the Backend Server

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### 4. Access Your Site

Open your browser and go to:
```
http://localhost:3000
```

## 📱 Testing M-Pesa Payments

### Test Phone Numbers (Sandbox)
- `254708374149`
- `254708374150`
- `254708374151`

### Test Flow

1. Add products to cart
2. Go to cart and click "Proceed to Checkout"
3. Enter test phone number: `254708374149`
4. Click "Pay with M-Pesa"
5. Check your terminal/console for the STK Push response

### Expected Response

**Success:**
```json
{
  "MerchantRequestID": "29115-34620561-1",
  "CheckoutRequestID": "ws_CO_191220191020363925",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

## 🔧 How It Works

### Architecture

```
Browser (Frontend)
    ↓
    | HTTP Request
    ↓
Backend Server (server.js)
    ↓
    | HTTPS Request
    ↓
M-Pesa Daraja API
```

### Flow

1. **Frontend** (`checkout.js`) sends payment request to **Backend**
2. **Backend** (`server.js`) gets M-Pesa access token
3. **Backend** generates password and timestamp
4. **Backend** calls M-Pesa STK Push API
5. **M-Pesa** sends push notification to customer's phone
6. Customer enters PIN on phone
7. **M-Pesa** sends callback to your server
8. **Backend** processes callback and updates order

## 🛠️ Troubleshooting

### CORS Error
✅ **Fixed!** The backend server now handles all M-Pesa API calls.

### "Failed to get access token"
- Check your consumer key and secret in `.env`
- Ensure credentials are for sandbox environment
- Check internet connection

### "Invalid Access Token"
- Token expires after 1 hour
- Server automatically gets new token for each request

### Callback URL Not Working
For local testing, you need a public URL. Options:
1. **ngrok**: `ngrok http 3000`
2. **localtunnel**: `lt --port 3000`
3. Update `MPESA_CALLBACK_URL` in `.env` with the public URL

## 📊 Monitoring

### Server Logs

The server logs all important events:
- ✅ Payment successful
- ❌ Payment failed
- 📱 STK Push initiated
- 🔔 Callback received

### Check Logs

```bash
# Terminal will show:
🚀 Server running on http://localhost:3000
📱 M-Pesa API endpoints ready
   - POST /api/mpesa/payment
   - POST /api/mpesa/callback

Initiating STK Push: { phone: '254708374149', amount: 1300, ... }
M-Pesa Response: { ResponseCode: '0', ... }
```

## 🔐 Security Notes

### Current Setup (Sandbox)
- ✅ Credentials in `.env` file
- ✅ Backend handles API calls
- ✅ CORS enabled for local development

### For Production
- [ ] Use production credentials from Safaricom
- [ ] Set up HTTPS with SSL certificate
- [ ] Restrict CORS to your domain only
- [ ] Add rate limiting
- [ ] Implement database for order tracking
- [ ] Add authentication/authorization
- [ ] Set up proper logging and monitoring
- [ ] Use environment-specific configs

## 📚 API Endpoints

### POST `/api/mpesa/payment`
Initiate STK Push payment

**Request:**
```json
{
  "phoneNumber": "254708374149",
  "amount": 1300,
  "accountReference": "Order123"
}
```

**Response:**
```json
{
  "ResponseCode": "0",
  "ResponseDescription": "Success",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

### POST `/api/mpesa/callback`
Receive payment confirmation from M-Pesa

### GET `/api/health`
Health check endpoint

## 🎯 Next Steps

1. ✅ Backend server running
2. ✅ M-Pesa integration working
3. ⏳ Set up public callback URL (ngrok/localtunnel)
4. ⏳ Test full payment flow
5. ⏳ Add database for order tracking
6. ⏳ Implement order confirmation page
7. ⏳ Add email notifications
8. ⏳ Apply for production credentials

## 📞 Support

- [Daraja API Documentation](https://developer.safaricom.co.ke/)
- [Daraja Portal](https://developer.safaricom.co.ke/login-register)
- [API Support](https://developer.safaricom.co.ke/support)
