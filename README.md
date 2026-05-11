# Eventix — Venue & Vendor Booking Platform

A full-stack booking platform for wedding/event venues and vendors built on
**TanStack Start + React 19** with **Lovable Cloud (Supabase)** as the backend.

It ships with:

- Public catalog: Venues, Vendors, Albums, Photos, Categories
- Auth (email + Google) with `customer / vendor / admin` roles
- **Cart** with per-user persistence
- **Checkout → Booking → Transaction** flow with pricing-rule engine
- **Admin panel** with full CRUD for every table
- Row-Level-Security (RLS) on every table

---

## 1. Tech Stack

| Layer        | Tech                                           |
| ------------ | ---------------------------------------------- |
| Framework    | TanStack Start v1 (Vite 7, React 19, SSR)      |
| Routing      | TanStack Router (file-based, `src/routes/`)    |
| Backend      | Lovable Cloud (Supabase Postgres + Auth + RLS) |
| Styling      | Tailwind v4 + custom CSS variables             |
| Realtime/RPC | Supabase JS SDK (browser client)               |

---

## 2. Local Setup

```bash
bun install
bun run dev          # http://localhost:5173
```

Lovable Cloud is already provisioned — `.env` is auto-generated and contains
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Do not edit it.

---

## 3. Database Overview

| Table             | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| `profiles`        | Public user data (mirrors `auth.users`)              |
| `user_roles`      | Role assignments — never put roles on `profiles`     |
| `venues`          | Venue catalog                                        |
| `vendor_profiles` | Vendor accounts (linked to a `user_id`)              |
| `vendor_listings` | Individual vendor services                           |
| `albums` / `photos` | Inspiration galleries                              |
| `event_categories`| Browseable categories                                |
| `cart_items`      | Per-user cart                                        |
| `pricing_rules`   | Tax / discount / fee rules applied at checkout       |
| `bookings`        | Order header                                         |
| `booking_items`   | Snapshotted order lines                              |
| `transactions`    | Payment attempts (manual / bkash / nagad / card / …) |
| `payment_proofs`  | Optional uploaded payment screenshots                |
| `enquiries`, `wishlist_items`, `reviews` | Auxiliary           |

All tables have RLS. Public catalog tables (`venues`, `vendor_*`, `albums`,
`photos`, `event_categories`) allow `SELECT` for everyone. User-owned tables
(`cart_items`, `bookings`, `transactions`, …) restrict to `auth.uid() =
user_id`. Every table also has an `*_admin_all` policy gated by
`has_role(auth.uid(), 'admin')`.

---

## 4. Admin Setup Guide

### 4.1 Create the first admin

1. Sign up a normal user from the homepage (email + password or Google).
2. Open **Lovable Cloud → Backend → SQL Editor** and run:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('<your-auth-user-id>', 'admin')
   on conflict do nothing;
   ```

   (Get your user id from the **Authentication → Users** page or
   `select id, email from auth.users;`.)

3. Reload the app and visit `/admin`.

After that, additional admins can be granted/revoked from
**Admin → Users & Roles** with a single checkbox — no SQL required.

### 4.2 Admin Panel Routes

| Route                  | Manages                                |
| ---------------------- | -------------------------------------- |
| `/admin`               | Dashboard with counts + revenue        |
| `/admin/venues`        | Venues catalog (CRUD)                  |
| `/admin/vendors`       | Vendor profiles (CRUD)                 |
| `/admin/listings`      | Vendor listings (CRUD)                 |
| `/admin/albums`        | Inspiration albums (CRUD)              |
| `/admin/photos`        | Photos (CRUD)                          |
| `/admin/categories`    | Event categories (CRUD)                |
| `/admin/pricing`       | Tax / discount / fee rules (CRUD)      |
| `/admin/bookings`      | Bookings + transactions + status flow  |
| `/admin/transactions`  | Raw transactions (CRUD)                |
| `/admin/users`         | Assign/remove admin / vendor / customer roles |

The `/admin` layout is gated by `isAdmin()` — non-admins are redirected.

### 4.3 Pricing Rules

Each rule has:

- **type**: `tax`, `discount`, or `fee`
- **value**: a percentage of the subtotal (e.g. `15` = 15%)
- **scope**: `all` / `venue` / `vendor` (currently applied to subtotal as a whole)
- **active** + optional `starts_at` / `ends_at` window

Active rules are computed at checkout (`computePricing()` in `src/lib/data.ts`)
and snapshotted onto the booking as `pricing_breakdown` so changes never
mutate historical orders.

### 4.4 Order Lifecycle

```
cart_items  ─►  createBooking()  ─►  bookings (pending)
                                 ├─► booking_items   (snapshot)
                                 └─► transactions    (initiated)

Admin clicks "Mark paid" on a transaction
   └─► transaction.status = success
       booking.amount_paid += tx.amount
       booking.status      = confirmed   (partial)
                          or completed   (fully paid)
```

`booking_status` enum: `pending | confirmed | completed | cancelled | refunded`.
`transaction_status` enum: `initiated | success | failed | refunded`.

Status changes and "Mark paid" are one-click in `/admin/bookings`.

---

## 5. Project Layout

```
src/
├── routes/                # File-based routes
│   ├── __root.tsx         # Root layout (do NOT replace)
│   ├── index.tsx          # Landing page
│   ├── venues.tsx, venue.$id.tsx
│   ├── vendor.$id.tsx, photos.tsx
│   ├── cart.tsx, checkout.tsx, my-bookings.tsx
│   ├── admin.tsx          # Admin layout (role guard)
│   └── admin.*.tsx        # Admin CRUD pages
├── components/
│   ├── admin/CrudTable.tsx  # Reusable admin CRUD UI
│   ├── AuthModal.tsx, Layout.tsx, cards.tsx
├── lib/
│   ├── data.ts            # ALL Supabase calls (catalog, cart, booking, admin)
│   └── supabase.ts        # Re-exports the generated client + helpers
└── integrations/supabase/ # Auto-generated — do NOT edit
```

---

## 6. Security Notes

- **Roles live in `user_roles`**, never on `profiles` — enforced by the
  `has_role()` `SECURITY DEFINER` function used in every RLS policy.
- **Service-role key** is never used in client code.
- **Cart / bookings / transactions** can only be read or written by their
  owning user (or an admin).
- Admin-only mutations on catalog tables go through RLS — there is no separate
  trusted backend; the policies are the contract.

---

## 7. Common Tasks

| I want to…                          | Do this                                       |
| ----------------------------------- | --------------------------------------------- |
| Add a new venue                     | `/admin/venues` → **+ New**                   |
| Add a 15% VAT                       | `/admin/pricing` → New, type=tax, value=15    |
| Promote a user to admin             | `/admin/users` → check the **Admin** column   |
| Mark a booking paid                 | `/admin/bookings` → **Mark paid** on the tx   |
| Cancel a booking                    | `/admin/bookings` → **→ cancelled**           |
| Inspect raw rows                    | Lovable Cloud → Database → table editor       |

---

## 8. Roadmap

- Stripe / bKash live payment integration (currently manual / admin-marked)
- Vendor self-service dashboard (separate from the admin panel)
- Email notifications on booking status change
- Per-listing pricing-rule scoping (the `scope` column is wired but not yet enforced server-side)
