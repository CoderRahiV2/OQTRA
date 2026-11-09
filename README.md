# OQTRA — Netlify full-stack website

A lightweight, responsive service website with Netlify Functions + Netlify Blobs backend.

## Included
- Customer-facing website with dark/light theme.
- Service catalogue and editable starting prices.
- Order form that saves orders in Netlify Blobs and opens WhatsApp Business.
- Backend coupon validation: percentage or fixed discount, optional advance-payment waiver.
- Private admin dashboard at `/admin.html`.
- Admin order status updates, coupon management, social/contact settings and pricing.
- No third-party database or external backend required.

## Deploy to Netlify
1. Create a new GitHub repository and upload the contents of this folder, or drag the folder into Netlify's manual deploy flow (Git deployment is recommended for ongoing edits).
2. In Netlify, open **Project configuration → Environment variables** and add:
   - `ADMIN_KEY` = a long, unique secret password (at least 24 random characters).
   - Set its scope to **Functions** and deploy context to Production (and Deploy Previews if needed).
3. Deploy the site. Netlify Functions and Blobs are provisioned by Netlify. The Blobs store is created on first use.
4. Open `https://YOUR-SITE.netlify.app/admin.html`, enter your `ADMIN_KEY`.
5. In **Settings & prices**, set your brand, WhatsApp number, Gmail, Facebook, Instagram and other URL. Adjust prices and advance percentage.
6. In **Coupons**, create codes. Select “Waive the advance payment” for a coupon that makes the initial advance ৳0.
7. Test an order and coupon before sharing your public site.

## Local development
Requires Node.js 20+.
```bash
npm install
npx netlify dev
```
Set `ADMIN_KEY` in your local shell before running Netlify Dev, or create a local `.env` file (never commit it):
```env
ADMIN_KEY=replace-with-a-long-random-secret
```

## Pricing behavior
Prices are **starting prices**, not guaranteed final quotes. Current implementation calculates estimates using the configured starting price. Confirm the final scope and price with the customer in WhatsApp before work begins.

Default services:
- University presentation: ৳150
- AI advertisement: ৳220
- AI content creation: ৳300
- Digital portfolio: ৳1,000
- Business website: ৳770
- Custom website: ৳999

Normal advance: 10% of discounted estimated total, rounded up to the next taka. A coupon with `waiveAdvance: true` makes advance ৳0. Coupon discounts can be percentage or fixed amount.

## Important security / operations
- Keep `ADMIN_KEY` secret. Never place it in frontend code or commit it to Git.
- Use HTTPS (Netlify provides it).
- Orders and coupons are stored in Netlify Blobs, not a local file. They persist across deploys.
- The public form does not collect payments; it creates an order and redirects the customer to WhatsApp.
- Consider periodic exports/backups of order data as your business grows.
- Add a spam/rate-limit layer before running large paid campaigns.
- The site uses Google Fonts for typography; system fallback fonts remain available if Google Fonts are blocked.


## Bengali, SEO and performance update
- The public site now uses English and Bangla together, including Bengali service descriptions and FAQ content.
- Selecting a service card opens its detailed description, included deliverables and an order button that preselects the service.
- Added page title, meta description, social sharing metadata, ProfessionalService structured data, `robots.txt`, and a sitemap template.
- The admin page is marked `noindex,nofollow` so it is not intended to appear in search results.
- Before launch, replace `YOUR-SITE-NAME.netlify.app` in `public/robots.txt` and `public/sitemap.xml` with your real Netlify domain or custom domain. Add the verified domain to Google Search Console and submit `/sitemap.xml`.
- Google Fonts are loaded with `display=swap`; the duplicate CSS font import was removed. Keep images compressed (WebP/AVIF) and add dimensions/lazy loading if you add image assets later.


### OQTRA brand assets
- `public/logo.svg` — responsive vector logo used in the website header, footer and admin header.
- `public/favicon.svg` — browser tab icon.
- `public/og-image.jpg` — social sharing preview image.


## Previous work and verified reviews
- Manage previous projects from Admin → Previous work. Only title, description and an optional live project URL are required; no PDF or video is required.
- Manage English/Bangla service descriptions from Admin → Service descriptions.
- Buyers can submit a review only when their order status is Completed and their WhatsApp number matches the order. Each completed order can submit one review. Reviews require admin approval before public display.
