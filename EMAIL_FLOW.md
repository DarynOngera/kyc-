# 📧 Email Flow Documentation

## Overview

The system now sends **two separate emails** to customers during the purchase process:

1. **Order Confirmation Email** - Sent immediately after order is created
2. **Payment Receipt Email** - Sent after M-Pesa payment is confirmed

## Email Flow

### Step 1: Customer Initiates Payment
- Customer clicks "Pay with M-Pesa" on checkout page
- M-Pesa STK push is sent (production only)
- Transaction record created with status: `initiated`
- **No email sent yet**

### Step 2: Customer Completes M-Pesa Payment
- Customer enters M-Pesa PIN on their phone
- M-Pesa processes payment
- M-Pesa sends callback to your server
- Transaction updated to status: `completed`
- **Payment Receipt Email sent** ✉️

**Email Details:**
- **Subject:** `Order Confirmation - [MPESA_RECEIPT] - KejaYaCapo`
- **Content:**
  - Payment receipt title
  - M-Pesa receipt number
  - Order ID
  - Phone number
  - Payment status: COMPLETED
  - Itemized list of products
  - Total amount paid
  - Thank you message

### Step 3: Order is Created
- Frontend calls `/create-order` endpoint
- Order record created in database
- Order items saved
- Cart cleared
- **Order Confirmation Email sent** ✉️

**Email Details:**
- **Subject:** `Order Confirmation #[ORDER_NUMBER] - KejaYaCapo`
- **Content:**
  - Order confirmation title
  - Order number
  - Order status: CONFIRMED
  - Itemized list of products
  - Total amount
  - Processing message

### Step 4: Admin Notification
- **Admin Email sent** to shop owner ✉️

**Email Details:**
- **Subject:** `New Order #[ORDER_ID] - KES [AMOUNT]`
- **Content:**
  - New order alert
  - Customer information (name, email, phone)
  - Payment confirmation
  - M-Pesa receipt
  - Order items
  - Action required message

## Email Templates

### 1. Payment Receipt Email
**File:** `netlify/functions/utils/email.js` → `generateTransactionEmailHTML()`

**Trigger:** M-Pesa callback with `ResultCode: 0`

**Sent to:** Customer

**Design:**
- Black header with "KEJAYACAPO" branding
- "Payment Receipt" title
- Receipt-style details table
- M-Pesa receipt prominently displayed
- Status badge: COMPLETED (black)
- Itemized product list
- Total paid amount
- Black footer with links

### 2. Order Confirmation Email
**File:** `netlify/functions/utils/email.js` → `generateOrderConfirmationHTML()`

**Trigger:** Order creation via `/create-order` endpoint

**Sent to:** Customer

**Design:**
- Black header with "KEJAYACAPO" branding
- "Order Confirmation" title
- Order details table
- Order number
- Status badge: CONFIRMED (black)
- Itemized product list
- Total amount
- Processing message
- Black footer with links

### 3. Admin Notification Email
**File:** `netlify/functions/utils/email.js` → `generateAdminNotificationHTML()`

**Trigger:** M-Pesa callback with `ResultCode: 0`

**Sent to:** Admin (shop owner)

**Design:**
- Black header with "NEW ORDER" alert
- Action required banner
- Customer information table
- Payment confirmation (green highlight)
- M-Pesa receipt
- Order items
- Total amount
- Action reminder

## Email Sequence Timeline

```
Customer Action          →  System Action              →  Email Sent
─────────────────────────────────────────────────────────────────────
1. Click "Pay with M-Pesa"
                        →  Create transaction
                        →  Send STK push
                        →  (No email)

2. Enter M-Pesa PIN
                        →  M-Pesa processes payment
                        →  Callback received
                        →  Update transaction
                        →  📧 Payment Receipt Email
                        →  📧 Admin Notification

3. Order confirmation page
                        →  Create order
                        →  Save order items
                        →  Clear cart
                        →  📧 Order Confirmation Email
```

## Configuration

### Environment Variables Required

```bash
# Resend API
RESEND_API_KEY=re_xxxxx

# Email Addresses
FROM_EMAIL=orders@kejayacapo.shop  # Must be verified domain
ADMIN_EMAIL=your-email@gmail.com   # Can be any email
```

### Domain Verification

For emails to work in production:

1. Go to https://resend.com/domains
2. Add domain: `kejayacapo.shop`
3. Add DNS records to your domain registrar:
   - TXT record for domain verification
   - CNAME record for DKIM
4. Wait for verification (5-10 minutes)

## Testing

### Test Email Sending

```bash
node test-email.js
```

### Test Full Flow Locally

1. Start dev server: `netlify dev`
2. Initiate payment from checkout
3. Simulate callback:
   ```bash
   curl -X POST http://localhost:8888/.netlify/functions/mpesa-callback \
     -H "Content-Type: application/json" \
     -d @test-callback.json
   ```
4. Check logs for email sending confirmation

### Expected Log Output

```
✅ Payment successful!
Attempting to send customer email to: customer@example.com
✅ Customer email sent successfully
Attempting to send admin notification
✅ Admin notification sent successfully
Transaction logged successfully
```

## Email Content Customization

### Change Brand Colors

Edit `netlify/functions/utils/email.js`:

```javascript
// Header background
style="background-color: #000000"  // Change to your brand color

// Status badges
style="background-color: #000000"  // Completed status
style="background-color: #666666"  // Pending status
```

### Add Logo

Replace text header with image:

```html
<img src="https://kejayacapo.shop/assets/logo/logo.jpg" 
     alt="KejaYaCapo" 
     style="max-width: 200px; display: block; margin: 0 auto;">
```

### Update Footer Links

```html
<a href="https://instagram.com/kejayacapo">Instagram</a>
<a href="https://twitter.com/kejayacapo">Twitter</a>
```

## Troubleshooting

### Emails Not Sending

**Check:**
1. `RESEND_API_KEY` is set correctly
2. `FROM_EMAIL` matches verified domain
3. Domain is verified in Resend dashboard
4. Check Netlify function logs for errors

**Common Errors:**

```
Error: The gmail.com domain is not verified
Solution: Change FROM_EMAIL to orders@kejayacapo.shop
```

```
Error: Resend API key not configured
Solution: Add RESEND_API_KEY to Netlify environment variables
```

### Emails Going to Spam

**Solutions:**
1. Verify domain in Resend
2. Add SPF/DKIM records (provided by Resend)
3. Avoid spam trigger words
4. Use professional email content

### Wrong Email Content

**Check:**
1. Data being passed to email functions
2. Item mapping in callback/create-order
3. User information retrieval

## Production Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] DNS records added and propagated
- [ ] `RESEND_API_KEY` in Netlify environment variables
- [ ] `FROM_EMAIL` set to `orders@kejayacapo.shop`
- [ ] `ADMIN_EMAIL` set to your email
- [ ] Test email sent and received
- [ ] Test both email templates
- [ ] Check email display in Gmail, Outlook, Apple Mail
- [ ] Verify mobile responsiveness
- [ ] Test with real transaction

## Email Analytics

Resend provides analytics for:
- Emails sent
- Delivery rate
- Open rate (if tracking enabled)
- Click rate
- Bounce rate

Access at: https://resend.com/emails

---

**Status:** Fully implemented and tested. Two emails are now sent:
1. Payment receipt after M-Pesa payment
2. Order confirmation after order creation
