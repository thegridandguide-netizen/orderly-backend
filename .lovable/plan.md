
## Step 1 — Import your uploaded project

The current Lovable project is the empty template. Your `reactify-refine-main.zip` is the actual venue/vendor booking app (venues, vendors, photos, checkout). I'll copy all files from the zip into this project so the existing UI becomes the working frontend.

## Step 2 — Enable Lovable Cloud (Supabase)

Provisions Postgres + Auth + Storage. Replaces the placeholder `src/lib/supabase.ts` with real generated clients.

## Step 3 — Database schema (migrations)

Content tables (exactly what `src/lib/data.ts` expects):
- `venues`, `vendor_profiles`, `vendor_listings`
- `albums`, `photos`, `event_categories`

Auth & roles:
- `profiles` (auto-created via trigger on `auth.users`)
- `user_roles` enum (`admin`, `vendor`, `customer`) + `has_role()` security-definer fn

Cart & Pricing module:
- `carts` (one active per user)
- `cart_items` (polymorphic: venue or vendor_listing, qty, unit_price snapshot, options JSONB)
- `pricing_rules` (admin-managed: discounts, taxes, service fees — type, value, scope, active)
- Server fn `recalculateCart()` returns `{ subtotal, discounts[], taxes[], fees[], total }`

Order & Transaction module:
- `orders` (status: pending/confirmed/cancelled/completed, totals, customer snapshot, event_date)
- `order_items` (frozen line items from cart)
- `transactions` (gateway, ref, amount, status: initiated/success/failed/refunded, raw payload)
- Server fn `createOrderFromCart()` — atomic: reads cart → inserts order+items → opens transaction → clears cart

RLS on every table: customers see own carts/orders; vendors see orders containing their listings; admins see all (via `has_role`).

## Step 4 — Admin Panel (`/admin/*`, role-gated)

Layout with sidebar + protected by `has_role(uid,'admin')` in route `beforeLoad`. CRUD pages with table + form (react-hook-form + zod):
- Dashboard (counts + recent orders + revenue)
- Venues, Vendor Listings, Vendor Profiles
- Albums, Photos, Event Categories
- Pricing Rules
- Orders (list, detail, status change, refund)
- Transactions (list, detail)
- Users & Roles (assign/revoke admin/vendor)

## Step 5 — Customer-facing cart & checkout

- Cart drawer (add/remove/qty) wired to `cart_items`
- `/checkout` upgraded: calls `recalculateCart`, collects event details, creates order + transaction, shows confirmation
- `/orders` page for the logged-in user

## Step 6 — Seed + first admin

Seed event categories and a few demo rows. Document how to promote the first user to admin (insert into `user_roles`).

## Technical notes

- Server logic via `createServerFn` in `*.functions.ts`; admin writes use `requireSupabaseAuth` + `has_role` check inside handler (defense in depth alongside RLS).
- Payments: stub gateway initially (transactions table records intent + manual mark-paid in admin). I can wire Stripe in a follow-up if you want.
- All money stored as integers in smallest unit (paisa) to avoid float issues — display via existing `fmtBDT`.

## What I need from you

1. **Confirm scope** above looks right.
2. **Payments now or later?** Stub today (admin marks paid) is fastest; Stripe adds a step.
3. **Currency**: existing code uses BDT — keep it?

Reply "go" (with answers to 2 & 3) and I'll start executing top to bottom. This will take multiple turns of work.
