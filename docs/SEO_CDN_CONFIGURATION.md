# SEO Configuration to Prevent CDN Domain Indexing

## Overview
This document explains SEO measures implemented to prevent non-primary hostnames (for example a CDN hostname) from being indexed by search engines, ensuring only your primary domain (`kejayacapo.shop`) appears in search results.

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

### 3. HTTP Headers via Reverse Proxy (Recommended)
Configure your reverse proxy (nginx) to add `X-Robots-Tag` headers to block indexing on non-primary hostnames.

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Robots-Tag = "noindex, nofollow"
```

**How it works:**
- When accessed via an alternate hostname (CDN/default domain), search engines should see `noindex, nofollow`
- When accessed via your primary custom domain, allow normal indexing

## Setup Instructions

### Step 1: Configure Custom Domain
Point your domain to your server IP (A record) and set up HTTPS (nginx + certbot).

### Step 2: Redirect Non-Primary Hostnames
If you have an alternate hostname, redirect it to the primary domain.

### Step 3: Add Domain-Specific Headers
Add `X-Robots-Tag: noindex, nofollow` only for non-primary hostnames.

## Advanced Configuration

### Option A: Conditional Robots.txt (Requires Server-Side Logic)
To serve different robots.txt based on the domain:

```javascript
// Example server-side handler
export default async (request, context) => {
  const url = new URL(request.url);
  
  if (url.hostname.includes('your-cdn-hostname')) {
    // Block non-primary hostname
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
curl -I https://your-cdn-hostname
```

Look for:
```
X-Robots-Tag: noindex, nofollow
```

### Check Robots.txt
Visit:
- `https://kejayacapo.shop/robots.txt`
- `https://your-cdn-hostname/robots.txt`

### Google Search Console
1. Add both domains to Google Search Console
2. Set `kejayacapo.shop` as preferred domain
3. Submit sitemap: `https://kejayacapo.shop/sitemap.xml`
4. Monitor indexing status

## Best Practices

### ✅ Do:
- Always use canonical tags on all pages
- Ensure your primary custom domain is the preferred hostname
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
2. **Site Search**: Search `site:your-cdn-hostname` on Google (should show no results)
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
- [X-Robots-Tag Documentation](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)

---

**Last Updated:** 2025-10-16  
**Status:** ✅ Implemented and Ready for Custom Domain Configuration
