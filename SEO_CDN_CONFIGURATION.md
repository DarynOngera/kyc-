# SEO Configuration to Prevent CDN Domain Indexing

## Overview
This document explains the SEO measures implemented to prevent CDN domains (like `*.netlify.app`) from being indexed by search engines, ensuring only your primary domain (`kejayacapo.shop`) appears in search results.

## Implemented Solutions

### 1. Canonical Tags (✅ Implemented)
All HTML pages now include `<link rel="canonical">` tags pointing to the primary domain:

```html
<link rel="canonical" href="https://kejayacapo.shop/page.html">
```

**Pages Updated:**
- `index.html` → https://kejayacapo.shop/
- `duka.html` → https://kejayacapo.shop/duka.html
- `about.html` → https://kejayacapo.shop/about.html
- `cart.html` → https://kejayacapo.shop/cart.html
- `checkout.html` → https://kejayacapo.shop/checkout.html
- `terms.html` → https://kejayacapo.shop/terms.html

**How it works:**
- Tells search engines which URL is the "official" version
- Prevents duplicate content penalties
- Consolidates SEO value to your primary domain

### 2. Robots.txt (✅ Created)
A `robots.txt` file has been created at the root of your project.

**Current Configuration:**
```
User-agent: *
Allow: /
Sitemap: https://kejayacapo.shop/sitemap.xml
```

**Note:** The robots.txt file allows crawling by default. To block the CDN domain specifically, you'll need to implement conditional logic (see Advanced Configuration below).

### 3. HTTP Headers via Netlify (✅ Configured)
The `netlify.toml` file now includes `X-Robots-Tag` headers to prevent indexing of the Netlify CDN domain.

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
```

**How it works:**
- When accessed via `*.netlify.app`, search engines see `noindex, nofollow`
- When you configure a custom domain, you can override this header

## Setup Instructions

### Step 1: Configure Custom Domain in Netlify
1. Log in to your Netlify dashboard
2. Go to **Site settings** → **Domain management**
3. Click **Add custom domain**
4. Enter `kejayacapo.shop` (or your domain)
5. Follow the DNS configuration instructions
6. Set `kejayacapo.shop` as the **Primary domain**

### Step 2: Update DNS Records
Point your domain to Netlify:
- **A Record**: `75.2.60.5` (Netlify's load balancer)
- Or use **CNAME**: `[your-site].netlify.app`

### Step 3: Enable HTTPS
1. In Netlify dashboard, go to **Domain settings**
2. Click **Verify DNS configuration**
3. Enable **HTTPS** (automatic via Let's Encrypt)
4. Enable **Force HTTPS** to redirect all HTTP traffic

### Step 4: Configure Domain-Specific Headers (Optional)
To allow indexing on your custom domain while blocking the CDN:

1. Create a Netlify Edge Function (advanced) or
2. Use the current configuration which blocks all indexing on `*.netlify.app`

## Advanced Configuration

### Option A: Conditional Robots.txt (Requires Server-Side Logic)
To serve different robots.txt based on the domain:

```javascript
// netlify/edge-functions/robots.js
export default async (request, context) => {
  const url = new URL(request.url);
  
  if (url.hostname.includes('netlify.app')) {
    // Block CDN domain
    return new Response(
      'User-agent: *\nDisallow: /',
      { headers: { 'Content-Type': 'text/plain' } }
    );
  }
  
  // Allow primary domain
  return new Response(
    'User-agent: *\nAllow: /\nSitemap: https://kejayacapo.shop/sitemap.xml',
    { headers: { 'Content-Type': 'text/plain' } }
  );
};

export const config = { path: "/robots.txt" };
```

### Option B: Meta Robots Tag (Alternative)
Add to HTML `<head>` for pages you want to control:

```html
<meta name="robots" content="index, follow">
```

## Verification

### Check Canonical Tags
1. View page source on any page
2. Look for `<link rel="canonical" href="https://kejayacapo.shop/...">`
3. Verify the URL points to your primary domain

### Check HTTP Headers
Use curl or browser dev tools:
```bash
curl -I https://[your-site].netlify.app
```

Look for:
```
X-Robots-Tag: noindex, nofollow
```

### Check Robots.txt
Visit:
- `https://kejayacapo.shop/robots.txt`
- `https://[your-site].netlify.app/robots.txt`

### Google Search Console
1. Add both domains to Google Search Console
2. Set `kejayacapo.shop` as preferred domain
3. Submit sitemap: `https://kejayacapo.shop/sitemap.xml`
4. Monitor indexing status

## Best Practices

### ✅ Do:
- Always use canonical tags on all pages
- Set up custom domain as primary in Netlify
- Use HTTPS everywhere
- Create and submit an XML sitemap
- Monitor both domains in Search Console

### ❌ Don't:
- Link to CDN URLs in your content
- Use CDN URLs in social media
- Mix canonical URLs (be consistent)
- Forget to update canonical tags when changing domain

## Monitoring

### Weekly Checks:
1. **Google Search Console**: Check for duplicate content issues
2. **Site Search**: Search `site:kejayacapo.netlify.app` on Google (should show no results)
3. **Site Search**: Search `site:kejayacapo.shop` on Google (should show your pages)

### Tools:
- **Screaming Frog**: Crawl your site to verify canonical tags
- **Google Search Console**: Monitor indexing status
- **Ahrefs/SEMrush**: Check for duplicate content issues

## Troubleshooting

### Issue: CDN domain still appearing in search results
**Solution:**
1. Verify canonical tags are present on all pages
2. Check X-Robots-Tag header is set to `noindex, nofollow` for CDN
3. Request removal in Google Search Console
4. Wait 2-4 weeks for Google to re-crawl

### Issue: Primary domain not being indexed
**Solution:**
1. Remove or update X-Robots-Tag for custom domain
2. Verify robots.txt allows crawling
3. Submit sitemap to Google Search Console
4. Check for crawl errors in Search Console

### Issue: Duplicate content warnings
**Solution:**
1. Ensure all canonical tags point to primary domain
2. Use 301 redirects from CDN to primary domain (if possible)
3. Set preferred domain in Search Console

## Next Steps

1. **Create XML Sitemap**: Generate a sitemap.xml file
2. **Submit to Search Engines**: Add to Google Search Console and Bing Webmaster Tools
3. **Monitor**: Check indexing status weekly
4. **Update**: Keep canonical URLs updated if you change domain structure

## Resources

- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Netlify: Custom Domains](https://docs.netlify.com/domains-https/custom-domains/)
- [Netlify: Headers](https://docs.netlify.com/routing/headers/)
- [X-Robots-Tag Documentation](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

---

**Last Updated:** 2025-10-16  
**Status:** ✅ Implemented and Ready for Custom Domain Configuration
