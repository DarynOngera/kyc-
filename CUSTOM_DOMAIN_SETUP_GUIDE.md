# Custom Domain Setup Guide for Netlify

## Prerequisites
- ✅ Domain purchased (e.g., kejayacapo.shop)
- ✅ Access to your domain registrar's DNS settings
- ✅ Netlify account with deployed site

## Step-by-Step Setup

### Step 1: Add Custom Domain in Netlify

1. **Log in to Netlify**
   - Go to https://app.netlify.com
   - Select your site (duka-replica)

2. **Navigate to Domain Settings**
   ```
   Site Dashboard → Domain settings (or Domain management)
   ```

3. **Add Custom Domain**
   - Click **"Add custom domain"** or **"Add domain alias"**
   - Enter your domain: `kejayacapo.shop`
   - Click **"Verify"**

4. **Add www Subdomain (Recommended)**
   - Click **"Add domain alias"** again
   - Enter: `www.kejayacapo.shop`
   - Click **"Verify"**

### Step 2: Choose Your DNS Configuration Method

Netlify offers two options:

#### Option A: Netlify DNS (Recommended - Easiest)
**Pros:** Automatic SSL, easier management, faster setup
**Cons:** Need to change nameservers at registrar

#### Option B: External DNS (Keep Current Registrar)
**Pros:** Keep existing DNS provider
**Cons:** Manual DNS record setup required

---

## Option A: Netlify DNS Setup (Recommended)

### 1. Enable Netlify DNS
```
Domain settings → Click your domain → "Set up Netlify DNS"
```

### 2. Get Netlify Nameservers
Netlify will provide 4 nameservers like:
```
dns1.p03.nsone.net
dns2.p03.nsone.net
dns3.p03.nsone.net
dns4.p03.nsone.net
```

### 3. Update Nameservers at Your Domain Registrar

**Common Registrars:**

#### GoDaddy:
```
1. Log in to GoDaddy
2. Go to "My Products" → "Domains"
3. Click your domain → "Manage DNS"
4. Scroll to "Nameservers" → Click "Change"
5. Select "Custom" or "I'll use my own nameservers"
6. Enter all 4 Netlify nameservers
7. Save changes
```

#### Namecheap:
```
1. Log in to Namecheap
2. Go to "Domain List" → Click "Manage" next to your domain
3. Find "Nameservers" section
4. Select "Custom DNS"
5. Enter all 4 Netlify nameservers
6. Click the green checkmark to save
```

#### Google Domains:
```
1. Log in to Google Domains
2. Click your domain
3. Go to "DNS" tab
4. Scroll to "Name servers"
5. Click "Use custom name servers"
6. Enter all 4 Netlify nameservers
7. Save
```

#### Cloudflare:
```
1. Log in to Cloudflare
2. Select your domain
3. Go to "DNS" → "Records"
4. Note: If using Cloudflare, see "Option B" below for better integration
```

### 4. Wait for DNS Propagation
- **Time:** 24-48 hours (usually faster, often 1-4 hours)
- **Check status:** Use https://dnschecker.org

### 5. Enable HTTPS in Netlify
```
1. Go back to Netlify → Domain settings
2. Scroll to "HTTPS" section
3. Click "Verify DNS configuration"
4. Once verified, click "Provision certificate" (automatic via Let's Encrypt)
5. Enable "Force HTTPS" to redirect all HTTP to HTTPS
```

---

## Option B: External DNS Setup (Keep Your DNS Provider)

### 1. Get Netlify's Load Balancer IP
In Netlify Domain settings, you'll see:
```
Primary domain: kejayacapo.shop
Points to: 75.2.60.5 (Netlify's load balancer)
```

### 2. Configure DNS Records at Your Registrar

#### For Root Domain (kejayacapo.shop):

**Method 1: A Record (Most Common)**
```
Type: A
Name: @ (or leave blank, or use "kejayacapo.shop")
Value: 75.2.60.5
TTL: 3600 (or Auto)
```

**Method 2: ALIAS/ANAME Record (If Supported)**
```
Type: ALIAS or ANAME
Name: @ (or leave blank)
Value: [your-site].netlify.app
TTL: 3600
```

#### For www Subdomain:
```
Type: CNAME
Name: www
Value: [your-site].netlify.app
TTL: 3600
```

### 3. Example DNS Configuration

Your DNS records should look like this:

| Type  | Name | Value                          | TTL  |
|-------|------|--------------------------------|------|
| A     | @    | 75.2.60.5                      | 3600 |
| CNAME | www  | [your-site].netlify.app        | 3600 |

### 4. Wait for DNS Propagation
- **Time:** 1-24 hours
- **Check:** https://dnschecker.org

### 5. Enable HTTPS in Netlify
```
1. Netlify → Domain settings → HTTPS
2. Click "Verify DNS configuration"
3. Click "Provision certificate"
4. Enable "Force HTTPS"
```

---

## Step 3: Set Primary Domain

### Choose Your Preferred URL:
- `kejayacapo.shop` (without www) - **Recommended**
- `www.kejayacapo.shop` (with www)

### Set in Netlify:
```
1. Domain settings → Options (next to your domain)
2. Click "Set as primary domain"
3. Netlify will automatically redirect the other version
```

---

## Step 4: Update Your Site Configuration

### 1. Update Canonical URLs (Already Done ✅)
Your canonical tags already point to `https://kejayacapo.shop`

### 2. Update Open Graph URLs (Optional)
If you want social media to use the custom domain, update in your HTML files:

**Current:**
```html
<meta property="og:url" content="https://kejayacapo.netlify.app/">
```

**Update to:**
```html
<meta property="og:url" content="https://kejayacapo.shop/">
```

### 3. Update Environment Variables (If Any)
If you have any API endpoints or environment variables with URLs, update them.

---

## Step 5: Verification & Testing

### 1. Check DNS Propagation
```bash
# Check A record
dig kejayacapo.shop

# Check CNAME record
dig www.kejayacapo.shop

# Or use online tool
https://dnschecker.org
```

### 2. Test Your Domain
```
✅ Visit https://kejayacapo.shop
✅ Visit https://www.kejayacapo.shop
✅ Visit http://kejayacapo.shop (should redirect to HTTPS)
✅ Check SSL certificate (click padlock in browser)
```

### 3. Verify Redirects
```
✅ Old Netlify URL should redirect to custom domain
✅ HTTP should redirect to HTTPS
✅ www should redirect to non-www (or vice versa)
```

### 4. Check SEO Configuration
```bash
# Verify canonical tags
curl https://kejayacapo.shop | grep canonical

# Verify X-Robots-Tag (should NOT show noindex on custom domain)
curl -I https://kejayacapo.shop | grep X-Robots-Tag
```

---

## Step 6: Update Google Search Console

### 1. Add New Domain
```
1. Go to https://search.google.com/search-console
2. Click "Add property"
3. Select "Domain" property type
4. Enter: kejayacapo.shop
5. Verify ownership (via DNS TXT record)
```

### 2. Set Preferred Domain
```
1. In Search Console, go to Settings
2. Set kejayacapo.shop as preferred domain
3. Submit sitemap: https://kejayacapo.shop/sitemap.xml
```

### 3. Request Removal of Old URLs (Optional)
```
1. Go to "Removals" in Search Console
2. Request removal of kejayacapo.netlify.app URLs
3. Wait for Google to process (1-2 weeks)
```

---

## Troubleshooting

### Issue: "Domain already registered to another site"
**Solution:**
```
1. Remove domain from other Netlify site first
2. Or contact Netlify support to transfer domain
```

### Issue: DNS not propagating
**Solution:**
```
1. Wait longer (up to 48 hours)
2. Clear your DNS cache: 
   - Mac: sudo dscacheutil -flushcache
   - Windows: ipconfig /flushdns
   - Linux: sudo systemd-resolve --flush-caches
3. Use incognito/private browsing
4. Check with https://dnschecker.org
```

### Issue: SSL certificate not provisioning
**Solution:**
```
1. Verify DNS is fully propagated
2. Check for CAA records blocking Let's Encrypt
3. Wait 24 hours and try "Provision certificate" again
4. Contact Netlify support if still failing
```

### Issue: Site shows "Page not found"
**Solution:**
```
1. Verify DNS records are correct
2. Check Netlify deploy status
3. Verify domain is set as primary
4. Check for redirect rules in netlify.toml
```

### Issue: Mixed content warnings (HTTP/HTTPS)
**Solution:**
```
1. Update all internal links to use HTTPS
2. Update external resources to HTTPS
3. Enable "Force HTTPS" in Netlify
```

---

## Quick Reference: Common Registrar DNS Settings

### GoDaddy DNS Path:
```
My Products → Domains → [Your Domain] → Manage DNS → DNS Records
```

### Namecheap DNS Path:
```
Domain List → Manage → Advanced DNS → Host Records
```

### Google Domains DNS Path:
```
My Domains → [Your Domain] → DNS → Custom records
```

### Cloudflare DNS Path:
```
[Your Domain] → DNS → Records
```

---

## Timeline Summary

| Task                          | Time Required        |
|-------------------------------|----------------------|
| Add domain in Netlify         | 2 minutes            |
| Update nameservers/DNS        | 5 minutes            |
| DNS propagation               | 1-48 hours           |
| SSL certificate provision     | 5-30 minutes         |
| Google re-crawl               | 1-2 weeks            |
| **Total to go live**          | **1-48 hours**       |

---

## Post-Setup Checklist

- [ ] Domain resolves to Netlify
- [ ] HTTPS is enabled and working
- [ ] Force HTTPS is enabled
- [ ] Primary domain is set
- [ ] www redirects properly
- [ ] Old Netlify URL redirects to custom domain
- [ ] Canonical tags point to custom domain
- [ ] Google Search Console updated
- [ ] Sitemap submitted
- [ ] Social media links updated (if needed)

---

## Need Help?

### Netlify Support:
- Documentation: https://docs.netlify.com/domains-https/custom-domains/
- Support: https://www.netlify.com/support/

### DNS Checker:
- https://dnschecker.org
- https://www.whatsmydns.net

### SSL Checker:
- https://www.ssllabs.com/ssltest/

---

**Created:** 2025-10-16  
**Status:** Ready to use  
**Estimated Setup Time:** 30 minutes (plus DNS propagation wait)
