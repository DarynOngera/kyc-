# M-Pesa Production Readiness Checklist

## 🔍 Current Issue Analysis

Your STK push is not working because:

1. **Code is hardcoded to sandbox URL** - Even on production, it calls `sandbox.safaricom.co.ke`
2. **Callback URL must be publicly accessible** - M-Pesa validates this before sending prompts
3. **Phone number must be registered** - For sandbox, only whitelisted numbers work

## ✅ Production Checklist

### 1. Get Production Credentials

- [ ] Apply for production access on Daraja Portal
- [ ] Get production **Shortcode** (your actual paybill number)
- [ ] Get production **Consumer Key**
- [ ] Get production **Consumer Secret**
- [ ] Get production **Passkey**

### 2. Update Environment Variables

Add to your `.env` (local) and your server environment (production):

```bash
# M-Pesa Environment (sandbox or production)
MPESA_ENVIRONMENT=production  # or 'sandbox' for testing

# Production Credentials
MPESA_SHORTCODE=your_production_shortcode
MPESA_CONSUMER_KEY=your_production_consumer_key
MPESA_CONSUMER_SECRET=your_production_consumer_secret
MPESA_PASSKEY=your_production_passkey

# Must be publicly accessible
MPESA_CALLBACK_URL=https://kejayacapo.shop/api/mpesa/callback
```

### 3. Code Changes Required

The code needs to dynamically switch between sandbox and production URLs based on environment.

**Current (Hardcoded):**
```javascript
const response = await axios.post(
    'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    // ...
);
```

**Should be (Dynamic):**
```javascript
const baseURL = process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

const response = await axios.post(
    `${baseURL}/mpesa/stkpush/v1/processrequest`,
    // ...
);
```

### 4. Callback URL Requirements

M-Pesa validates your callback URL **before** sending the STK push. It must:

- ✅ Be publicly accessible (HTTPS)
- ✅ Return 200 OK on POST requests
- ✅ Not redirect
- ✅ Respond within 30 seconds

**Test your callback:**
```bash
curl -X POST https://kejayacapo.shop/api/mpesa/callback \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

Should return: `200 OK`

### 5. Phone Number Format

Must be in format: `254XXXXXXXXX` (no spaces, no +)

**Valid:**
- `254757238817` ✅
- `254712345678` ✅

**Invalid:**
- `+254757238817` ❌
- `0757238817` ❌
- `254 757 238 817` ❌

### 6. Testing Strategy

#### Phase 1: Sandbox Testing (Current)
- Use sandbox credentials
- Only whitelisted numbers receive prompts
- Simulate callbacks for testing

#### Phase 2: Production Testing
- Use production credentials
- Real money transactions
- All Kenyan numbers work
- Real STK prompts sent

### 7. Common Issues & Solutions

#### Issue: "Success. Request accepted for processing" but no prompt

**Causes:**
1. Callback URL not accessible
2. Phone number not whitelisted (sandbox)
3. Shortcode/Passkey mismatch
4. M-Pesa service downtime

**Solution:**
- Verify callback URL is accessible
- Check M-Pesa status: https://developer.safaricom.co.ke/status
- Use production credentials for real testing

#### Issue: "Invalid Access Token"

**Causes:**
1. Wrong consumer key/secret
2. Credentials expired
3. Environment mismatch (using sandbox creds on production URL)

**Solution:**
- Regenerate credentials in Daraja Portal
- Ensure environment matches credentials

#### Issue: "Invalid Shortcode"

**Causes:**
1. Shortcode doesn't match passkey
2. Using sandbox shortcode with production URL

**Solution:**
- Verify shortcode and passkey match
- Check environment variable

## 🚀 Migration Path: Sandbox → Production

### Step 1: Update Code (I'll do this)
- Add environment switching
- Make URLs dynamic
- Add production validation

### Step 2: Get Production Credentials
- Apply on Daraja Portal
- Wait for approval (1-3 days)
- Copy credentials

### Step 3: Configure Production
- Add credentials to your server environment
- Set `MPESA_ENVIRONMENT=production`
- Deploy

### Step 4: Test with Small Amount
- Use real phone number
- Test with KES 1
- Verify prompt received
- Verify callback processed
- Verify email sent

### Step 5: Go Live
- Update amounts
- Monitor transactions
- Check error logs

## 📊 Current vs Production Comparison

| Feature | Sandbox | Production |
|---------|---------|------------|
| **URL** | sandbox.safaricom.co.ke | api.safaricom.co.ke |
| **Phone Numbers** | Whitelisted only | All Kenyan numbers |
| **STK Prompts** | Unreliable | Always sent |
| **Real Money** | No | Yes |
| **Testing** | Free | Costs real money |
| **Approval** | Instant | 1-3 days |

## 🔧 Next Steps

1. **I'll update the code** to support both environments
2. **You apply for production** credentials
3. **We test on production** when approved
4. **Go live** with confidence

---

**Ready to proceed?** Let me update the code to support production.
