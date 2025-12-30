# Testing Order Confirmation Email

## What Changed

Added **order confirmation email** that is sent when an order is created (after payment completes).

## Email Flow

1. **Payment Receipt Email** - Sent when M-Pesa payment completes (already working)
2. **Order Confirmation Email** - Sent when order is created (NEW)
3. **Admin Notification** - Sent to admin when payment completes (already working)

## How to Test

### On Deployed Site

1. **Add items to cart**
2. **Go to checkout**
3. **Sign in** (if not already)
4. **Click "Pay with M-Pesa"**
5. **Wait for payment to complete** (or simulate callback)
6. **Check server logs** for:
   ```
   📧 Attempting to send order confirmation email to: your-email@example.com
   ✅ Order confirmation email sent successfully
   ```

### Check Logs

Check your process manager logs (systemd, pm2, docker logs, etc.)

### Expected Log Output

```
Fetching user details for email, userId: xxx-xxx-xxx
📧 Attempting to send order confirmation email to: customer@example.com
Order details: {
  orderNumber: 'KYC-1234567890-ABC123',
  amount: 5199,
  itemCount: 2
}
✅ Order confirmation email sent successfully: { id: 'xxx' }
```

### If Email Not Sent

Check logs for these messages:

**Issue 1: No user found**
```
⚠️ No user email found, skipping order confirmation email
```
**Solution:** User record doesn't have email - check database

**Issue 2: Email sending failed**
```
❌ Failed to send order confirmation email: {
  error: "The gmail.com domain is not verified"
}
```
**Solution:** FROM_EMAIL must be orders@kejayacapo.shop (verified domain)

**Issue 3: Function not called**
```
(No logs at all)
```
**Solution:** create-order endpoint not being called - check frontend

## Email Content

The order confirmation email includes:

- **Header:** KEJAYACAPO branding
- **Title:** "Order Confirmation"
- **Order Number:** Unique order ID
- **Status:** CONFIRMED
- **Items:** List of purchased products with quantities
- **Total:** Total amount
- **Message:** "Your order has been received!"
- **Footer:** Contact info and links

## Differences from Payment Receipt

| Feature | Payment Receipt | Order Confirmation |
|---------|----------------|-------------------|
| **Sent When** | After M-Pesa payment | After order creation |
| **Title** | "Payment Receipt" | "Order Confirmation" |
| **Shows** | M-Pesa receipt number | Order number |
| **Status** | COMPLETED | CONFIRMED |
| **Focus** | Payment proof | Order details |

## Troubleshooting

### Email Not Received

1. **Check spam folder**
2. **Verify FROM_EMAIL** is set to `orders@kejayacapo.shop`
3. **Check Resend dashboard** for delivery status
4. **Check server logs** for errors

### Wrong Email Content

1. **Check cart items** are being passed correctly
2. **Verify user data** is retrieved
3. **Check email template** in `api/utils/email-impl.js`

### Email Sent But Order Not Created

1. **Check database** for order record
2. **Check transaction status** is `completed`
3. **Verify cart items** exist

## Testing Locally

```bash
# Start dev server
npm run dev

# In another terminal, simulate the flow:
# 1. Create a transaction (via payment)
# 2. Simulate callback
curl -X POST http://localhost:3000/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d @test-callback.json

# 3. Create order
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "your-transaction-id",
    "userId": "your-user-id",
    "cartItems": [
      {"name": "Test Product", "quantity": 1, "price": 100}
    ]
  }'

# Check logs for email confirmation
```

## Production Checklist

Before going live, verify:

- [ ] `FROM_EMAIL=orders@kejayacapo.shop` set in server environment
- [ ] Domain verified in Resend
- [ ] Test order created successfully
- [ ] Order confirmation email received
- [ ] Payment receipt email received
- [ ] Admin notification received
- [ ] All emails display correctly
- [ ] Links in emails work

## Next Steps

1. **Deploy is automatic** - Changes are already live
2. **Test on production** - Create a real order
3. **Check your email** - You should receive order confirmation
4. **Monitor logs** - Watch for any errors

---

**Status:** Deployed and ready to test. Order confirmation emails will now be sent automatically when orders are created.
