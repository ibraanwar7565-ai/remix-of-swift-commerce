

## Customer Notification System — Current State & Plan

### What Already Exists

Your app already has three notification systems in place:

1. **New Product Alerts** — When admin adds a product, all browsing customers get a real-time toast + sound via Supabase Realtime. Works globally.
2. **Promotion Alerts** — Admin-created promotions trigger real-time toasts + sound for logged-in customers, re-sent every 6 hours by a background job.
3. **Back-in-Stock "Notify Me"** — Customers can click "Notify Me" on out-of-stock products. An edge function (`notify-back-in-stock`) checks for restocked items and sends email via Resend.

### What Needs Improvement

| Area | Current Gap | Planned Fix |
|------|-------------|-------------|
| **Price change alerts** | No system exists for notifying customers when a product they watch has a price drop or change | Add a "Watch Price" feature + real-time price change detection |
| **Notification center** | Notifications are toast-only — once dismissed, they're gone forever | Add a persistent notification inbox/bell icon so customers can review past notifications |
| **Back-in-stock trigger** | The edge function exists but needs to be scheduled (cron) to run automatically | Set up a periodic cron job to auto-check and send back-in-stock emails |
| **Advert banners** | Promo banners are hardcoded images in `PromoBanners.tsx` | Make promo banners admin-manageable from the promotions dashboard |

### Implementation Plan

#### Step 1 — Notification Inbox (Bell Icon)
- Create a `notifications` database table to store all customer notifications (new product, promo, price change, back-in-stock)
- Add a bell icon in the store header showing unread count badge
- Open a sheet/drawer listing all past notifications with read/unread status
- Each notification links to the relevant product or promo

#### Step 2 — Price Watch & Price Drop Alerts
- Create a `price_watches` table (user_id, product_id, watched_price)
- Add a "Watch Price" button on product cards (next to the heart/favorite)
- Create a database trigger on `products` table that fires on price UPDATE
- When price drops below watched_price, insert a notification into the inbox and show a real-time toast

#### Step 3 — Schedule Back-in-Stock Emails
- Set up a pg_cron job to call the existing `notify-back-in-stock` edge function every 15 minutes automatically
- Also insert a notification into the inbox when a watched product is restocked

#### Step 4 — Admin-Managed Promo Banners
- Extend the existing `promotions` table with `banner_image_url` and `banner_link` columns
- Replace the hardcoded `PromoBanners` component to pull active promotions from the database
- Admin can upload banner images and set links from the Promotions dashboard

### Technical Details

- **Notifications table**: `id, user_id, type (new_product|promo|price_drop|back_in_stock), title, body, product_id, read, created_at` with RLS so users only see their own
- **Price watches table**: `id, user_id, product_id, watched_price, created_at` with unique constraint on (user_id, product_id)
- **Real-time**: Enable Supabase Realtime on the `notifications` table so the bell badge updates instantly
- **Cron**: pg_cron + pg_net to invoke `notify-back-in-stock` every 15 minutes

