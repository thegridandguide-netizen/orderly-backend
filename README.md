# Eventix — Event Booking Platform

A full-stack event booking app for venues and vendors built with **TanStack Start (React 19 + Vite)** and **Lovable Cloud (Supabase)**.

---

## Features

### Customer
- Browse **Venues**, **Vendors**, **Photos**, and an **Explore** hub
- Filter by city, category/type, price, rating
- Wishlist, Cart, Checkout with deposit / full payment
- **My Bookings** with payment status tracking
- **My Profile** (name, phone, city, avatar, password change)

### Admin (`/admin`)
Role-gated dashboard with full CRUD over:
- Venues, Vendor Listings, Vendor Profiles
- Albums, Photos, Event Categories
- **Pricing Rules** (tax / discount / fee — percent or flat)
- **Bookings & Transactions** (mark paid → auto-advances booking status)
- Users & Roles (toggle admin / vendor / customer)

All admin forms now use **dropdowns** that share the same source-of-truth as user-side filter chips (`src/lib/filters.ts`).

---

## Admin Setup Guide

1. Sign up a regular user via the app.
2. Open Lovable Cloud → SQL Editor and run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_ID_HERE', 'admin');
   ```
   Get `YOUR_USER_ID_HERE` from `select id, email from auth.users;`.
3. Reload the app and visit **/admin**.

---

## Filter Source-of-Truth

All filter dropdowns (admin and user side) are defined in **`src/lib/filters.ts`**:

| Constant              | Used in                                        |
|-----------------------|-----------------------------------------------|
| `CITIES`              | venues page, vendors page, admin city dropdowns |
| `VENUE_TYPES`         | venues page filter chips, admin venues form     |
| `VENDOR_CATEGORIES`   | vendors page filter chips, admin listings form  |
| `PRICING_RULE_TYPES`  | admin pricing form (`tax_percent`, `fee_percent`, …) |
| `PRICING_RULE_SCOPES` | admin pricing form (`all`, `venue`, `vendor`)   |
| `loadVendorProfileOptions` | admin listings → vendor dropdown          |
| `loadAlbumOptions`    | admin photos → album dropdown                  |

Edit one place → both sides update.

---

## Routes

| Path            | Description                              |
|-----------------|------------------------------------------|
| `/`             | Landing                                  |
| `/venues`       | Venue listing + filters                  |
| `/venue/$id`    | Venue detail                             |
| `/vendors`      | Vendor listing + filters **(new)**       |
| `/vendor/$id`   | Vendor detail                            |
| `/explore`      | Explore hub **(new)**                    |
| `/photos`       | Photo gallery                            |
| `/cart`         | Cart                                     |
| `/checkout`     | Checkout (with pricing breakdown)        |
| `/my-bookings`  | Authenticated user bookings              |
| `/profile`      | Authenticated user profile               |
| `/admin/*`      | Admin panel (role: admin)                |

---

## Pricing Engine

`computePricing(subtotal)` in `src/lib/data.ts` reads active rules from `pricing_rules` and computes tax / discount / fee:

- Rule type ending in `_percent` → applied as % of subtotal
- Rule type ending in `_flat` → applied as flat amount
- Result is snapshotted to `bookings.pricing_breakdown` so historical orders are stable even if rules change later.

`adminMarkTransactionPaid(txId)` advances the booking:
- partial payment → `confirmed`
- full payment → `completed`

---

## Database Schema (key tables)

`profiles`, `user_roles`, `venues`, `vendor_profiles`, `vendor_listings`,
`event_categories`, `albums`, `photos`, `cart_items`, `wishlist_items`,
`bookings`, `booking_items`, `transactions`, `payment_proofs`,
`enquiries`, `reviews`, `pricing_rules`.

All tables have RLS enabled. Public-readable: venues/vendors/photos/albums/categories/reviews. Per-user: cart, wishlist, profile, bookings. Admin-only writes for catalog tables.

---

## Recent Fixes (this release)

| Issue                                          | Fix                                                                 |
|------------------------------------------------|---------------------------------------------------------------------|
| `/vendors` and `/explore` returned 404         | Added `src/routes/vendors.tsx` and `src/routes/explore.tsx`         |
| Admin "Vendor Listings" used free-text inputs  | All key fields are now dropdowns (city, category, vendor)           |
| User-side cards missing fallback info          | `VendorCardView` now shows fallback image, "Price on request", capitalised category, location fallback |
| Profile crashed for legacy users (no DB row)   | `getMyProfile` upserts a stub row; backfill ran for existing users  |
| Admin pages picked up public navbar / CSS      | `Layout` skips navbar + bottom-nav on `/admin/*`; CrudTable wrapped in `.admin-scope` |
| `pricing_rules` form used wrong enum values    | Now uses `tax_percent` / `fee_percent` / `discount_*`               |
| `computePricing` ignored real enum values      | Handles both `_percent` and `_flat` rule types                      |
| Empty database → blank pages                   | Seeded 6 venues, 4 vendors, 6 listings, 4 albums, 8 photos, 6 categories, 2 pricing rules |

---

## Blackbox QA Checklist

After applying these changes, walk these flows:

| Route                  | Expected                                                      |
|------------------------|---------------------------------------------------------------|
| `/`                    | Hero loads, handpicked venues render                          |
| `/venues`              | 6 seeded venues, filters reduce/restore results               |
| `/vendors`             | 6 seeded listings, category chips filter correctly            |
| `/explore`             | 3 hub tiles, 6 event categories visible                       |
| `/photos`              | 8 photo tiles                                                 |
| `/cart` (signed in)    | Add a venue → see line item, qty editing works                |
| `/checkout`            | Pricing breakdown shows VAT 5% + Service fee 2%               |
| `/my-bookings`         | Latest booking visible after checkout                         |
| `/profile`             | Form pre-filled; save persists; password change works         |
| `/admin`               | Loads only for admin user; sidebar visible without public navbar |
| `/admin/listings`      | "+ New" form has dropdowns for city / category / vendor       |
| `/admin/pricing`       | Rule type dropdown shows `tax_percent` etc.                   |
| `/admin/bookings`      | "Mark paid" advances booking status                           |
| `/admin/users`         | Toggling admin role updates `user_roles`                      |

---

## Local Dev

Lovable handles build, deploy, and Cloud (Supabase) automatically. Just edit code in the workspace.

For environment variables, see Lovable Cloud → Settings. Never edit `.env` directly.

---

## Project Structure

```
src/
  routes/             TanStack file-based routes
    admin.*.tsx       Admin sub-routes
    vendors.tsx       NEW
    explore.tsx       NEW
    profile.tsx
  components/
    Layout.tsx        Public navbar / mobile drawer (skipped on /admin)
    admin/CrudTable.tsx  Generic admin CRUD table + form
    cards.tsx         VenueCardView, VendorCardView
  lib/
    data.ts           All DB calls, pricing engine, ordering
    filters.ts        NEW — single source of truth for dropdowns
    supabase.ts       Re-exports + formatters
  integrations/supabase/   Auto-generated client + types
supabase/migrations/  SQL migrations (seed data, schema)
```

## Documentation

Full specification documents live in `docs/`:

- [`docs/SRS.md`](docs/SRS.md) — Software Requirements Specification (functional & non-functional requirements, acceptance criteria).
- [`docs/DFD.md`](docs/DFD.md) — Data Flow Diagrams (Level 0 context, Level 1 processes, Level 2 zoom-ins for Pricing Engine and Payment Verification).

### Project Modeling Package

The full modeling bundle is available as downloadable artifacts (see chat) and mirrored in `docs/modeling/`:

| # | Artifact | Format |
|---|----------|--------|
| 1 | Project Proposal | `01_Project_Proposal.md` |
| 2 | UML original file (editable) | `02_UML.drawio.xml` — open in [diagrams.net](https://app.diagrams.net) |
| 3 | ER Diagram | `03_ER_Diagram.mmd` (Mermaid) |
| 4 | Use Case Diagram | `04_Use_Case_Diagram.mmd` |
| 5 | Class Diagram | `05_Class_Diagram.mmd` |
| 6 | State Diagram (Booking lifecycle) | `06_State_Diagram.mmd` |
| 7 | Sequence Diagram (Checkout + Payment) | `07_Sequence_Diagram.mmd` |

The `.drawio.xml` file contains four pages (Class, Use Case, State, Sequence) and is fully editable in draw.io / diagrams.net or VS Code's Draw.io Integration extension.

Inline code documentation: every major module carries a top-of-file docstring
explaining its responsibilities — see `src/lib/data.ts`,
`src/components/admin/CrudTable.tsx`, `src/routes/checkout.tsx`,
`src/routes/my-bookings.tsx`, and `src/routes/admin.bookings.tsx`.


## Recent fixes (May 15, 2026)
- **Profile page double navbar** — the route no longer wraps itself in `<Layout>` (the root layout already does).
- **Bookings infinite-recursion RLS error** — `bookings` ↔ `booking_items` policies now go through `SECURITY DEFINER` helpers (`user_owns_booking`, `is_vendor_for_booking`, `vendor_owns_listing`) so Postgres no longer recurses when `/my-bookings` loads nested booking items.
- **BD-local filters everywhere** — `src/routes/venues.tsx` and `src/routes/vendors.tsx` import `CITIES`, `VENUE_TYPES`, and `VENDOR_CATEGORIES` from `src/lib/filters.ts`, the same constants used by the admin dropdowns. Venues also support an `area` text filter (Gulshan, Banani, …) backed by `venues.area ILIKE %q%`.
