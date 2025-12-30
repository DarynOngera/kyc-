# Email Templates Guide

## Overview

The email system sends beautifully designed receipt-style emails that match your site's minimalist black and white aesthetic.

## Email Types

### 1. Customer Receipt Email
**Sent to:** Customer after successful payment  
**Subject:** `Order Confirmation - KejaYaCapo`

**Features:**
- ✅ Receipt-style design with clean typography
- ✅ M-Pesa receipt number prominently displayed
- ✅ Order ID and transaction details
- ✅ Itemized list of purchased products
- ✅ Total amount paid
- ✅ Contact information
- ✅ Mobile-responsive design

### 2. Admin Notification Email
**Sent to:** Admin/shop owner after successful payment  
**Subject:** `New Order #[ORDER_ID] - KES [AMOUNT]`

**Features:**
- ✅ Action-required alert banner
- ✅ Customer contact information (clickable email/phone)
- ✅ Payment confirmation with M-Pesa receipt
- ✅ Order items breakdown
- ✅ Professional admin-focused layout

## Design Principles

### Color Scheme
- **Primary:** Black (#000000)
- **Background:** White (#FFFFFF) / Light Gray (#F5F5F5)
- **Text:** Black (#000000) / Gray (#666666)
- **Borders:** Light Gray (#E0E0E0)

### Typography
- **Font:** System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- **Headers:** Uppercase with letter-spacing
- **Receipt Numbers:** Monospace font (Courier New)
- **Sizes:** Hierarchical from 11px to 42px

### Layout
- **Max Width:** 600px (email-safe)
- **Padding:** Consistent 30px spacing
- **Tables:** Used for email compatibility
- **Responsive:** Mobile-friendly with media queries

## Preview

Open `email-preview.html` in your browser to see how the customer receipt looks.

## Configuration

### Environment Variables Required

```bash
# Resend API Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Email Addresses
FROM_EMAIL=orders@kejayacapo.shop
ADMIN_EMAIL=admin@kejayacapo.shop
```

### Setting Up Resend

1. **Create Account:** https://resend.com
2. **Verify Domain:** Add your domain (kejayacapo.shop)
3. **Get API Key:** Dashboard → API Keys → Create
4. **Add to .env:** Copy the key to your `.env` file

### Domain Verification (Important!)

For production emails to work:

1. Go to Resend Dashboard → Domains
2. Click "Add Domain"
3. Enter: `kejayacapo.shop`
4. Add the DNS records provided by Resend to your domain registrar
5. Wait for verification (usually 5-10 minutes)

**DNS Records to Add:**
```
Type: TXT
Name: @
Value: [Provided by Resend]

Type: CNAME
Name: resend._domainkey
Value: [Provided by Resend]
```

## Email Sending Flow

### When Payment Completes:

1. **M-Pesa Callback Received** → `mpesa-callback.js`
2. **Transaction Updated** → Status set to "completed"
3. **Customer Email Sent** → Receipt with order details
4. **Admin Email Sent** → Notification with action required

### Code Location

```
api/utils/email-impl.js
├── sendTransactionEmail()      # Customer receipt
├── sendAdminNotification()     # Admin alert
├── generateTransactionEmailHTML()
└── generateAdminNotificationHTML()
```

## Testing Emails Locally

### Method 1: Use Resend Test Mode

```javascript
// In mpesa-callback.js, after successful payment:
await sendTransactionEmail(
    'customer@example.com',
    'Order Confirmation - KejaYaCapo',
    {
        customerName: 'Test Customer',
        orderId: 'TEST123',
        amount: 5199,
        mpesaReceipt: 'QAB1CD2E3F',
        phoneNumber: '254757238817',
        status: 'completed',
        items: [
            { name: 'Premium T-Shirt', quantity: 2, price: 2500 },
            { name: 'Hoodie', quantity: 1, price: 2699 }
        ]
    }
);
```

### Method 2: Preview HTML

Open `email-preview.html` in your browser to see the design without sending actual emails.

## Customization

### Change Brand Colors

Edit `api/utils/email-impl.js`:

```javascript
// Header background
style="background-color: #000000"  // Change to your color

// Status badge
style="background-color: #000000"  // Change to your color
```

### Add Logo Image

Replace text header with image:

```html
<img src="https://kejayacapo.shop/assets/logo/logo.jpg" 
     alt="KejaYaCapo" 
     style="max-width: 200px; display: block; margin: 0 auto;">
```

### Modify Footer Links

Update social media links:

```html
<a href="https://instagram.com/kejayacapo" ...>Instagram</a>
<a href="https://twitter.com/kejayacapo" ...>Twitter</a>
```

## Email Best Practices

✅ **DO:**
- Use inline CSS (required for email clients)
- Use tables for layout (email-safe)
- Keep width under 600px
- Test in multiple email clients
- Include plain text version (Resend does this automatically)

❌ **DON'T:**
- Use external CSS files
- Use JavaScript
- Use background images (limited support)
- Use complex layouts
- Forget mobile responsiveness

## Troubleshooting

### Emails Not Sending

1. **Check API Key:** Verify `RESEND_API_KEY` is set correctly
2. **Check Domain:** Ensure domain is verified in Resend
3. **Check Logs:** Look for errors in server logs
4. **Check FROM_EMAIL:** Must match verified domain

### Emails Going to Spam

1. **Verify Domain:** Complete DNS verification
2. **Add SPF/DKIM:** Resend provides these automatically
3. **Avoid Spam Words:** Don't use "FREE", "WINNER", etc.
4. **Include Unsubscribe:** (Optional for transactional emails)

### Styling Issues

1. **Use Inline Styles:** Email clients strip `<style>` tags
2. **Test in Gmail:** Most restrictive email client
3. **Use Tables:** Flexbox/Grid don't work in emails
4. **Check Preview:** Use `email-preview.html`

## Production Checklist

Before going live:

- [ ] Domain verified in Resend
- [ ] DNS records added and verified
- [ ] `RESEND_API_KEY` configured in server environment
- [ ] `FROM_EMAIL` matches verified domain
- [ ] `ADMIN_EMAIL` set to correct address
- [ ] Test email sent and received successfully
- [ ] Email displays correctly in Gmail, Outlook, Apple Mail
- [ ] Mobile display tested
- [ ] Links work correctly
- [ ] Contact information is accurate

## Support

- **Resend Docs:** https://resend.com/docs
- **Email Testing:** https://www.emailonacid.com
- **HTML Email Guide:** https://www.campaignmonitor.com/css/

---

**Need help?** Check the server logs for detailed error messages.
