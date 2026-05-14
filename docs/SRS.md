# Software Requirements Specification (SRS)
## Event & Venue Booking Platform

**Version:** 1.0
**Date:** May 14, 2026
**Status:** Implemented

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for a web-based **Event & Venue Booking Platform** that connects customers with venues and service vendors (photographers, decorators, caterers, etc.). The system supports browsing, filtering, cart-based checkout, manual payment verification, and a full administrative back-office.

### 1.2 Scope
The platform provides:
- A **public storefront** for discovering venues and vendors.
- A **customer portal** for booking, payment submission, and profile management.
- An **admin panel** for managing every entity in the catalogue, reviewing payment proofs, and configuring pricing rules.

### 1.3 Definitions
| Term | Meaning |
|------|---------|
| Listing | A purchasable vendor service item (`vendor_listings`) |
| Venue | A physical bookable location (`venues`) |
| Booking | A confirmed cart at checkout (`bookings`) |
| Payment Proof | Customer-submitted evidence of an offline payment |
| Pricing Rule | A tax / fee / discount applied at checkout |

### 1.4 References
- Tech stack: TanStack Start v1, React 19, Vite 7, Tailwind v4, Supabase (Lovable Cloud).
- Project README in repo root for setup.

---

## 2. Overall Description

### 2.1 Product Perspective
A single-page React application served via TanStack Start with file-based routing. Backend is Supabase (Postgres + Auth + RLS). Server-side mutations run via TanStack `createServerFn`.

### 2.2 User Classes
1. **Guest** — browse-only.
2. **Customer** — authenticated user; can book, pay, review, manage profile.
3. **Vendor** — owns `vendor_profiles` rows; sees their listings' bookings.
4. **Admin** — full CRUD on every table via `/admin/*`.

### 2.3 Operating Environment
- Modern desktop & mobile browsers.
- Cloudflare Workers runtime (server fns).
- Postgres 15 (Supabase managed).

### 2.4 Constraints
- All data access governed by Row-Level Security policies.
- Roles stored in dedicated `user_roles` table — never on profile.
- Payments are **manual** (no external gateway in MVP).

---

## 3. Functional Requirements

### FR-1 Authentication
- FR-1.1 User can sign up with email/password.
- FR-1.2 User can log in / log out.
- FR-1.3 New users automatically receive a `profiles` row (trigger).
- FR-1.4 Legacy users without a profile get one upserted on first profile view.

### FR-2 Catalogue Browsing
- FR-2.1 `/` shows featured venues, categories, hubs.
- FR-2.2 `/venues` lists venues with filters (city, type, capacity).
- FR-2.3 `/vendors` lists vendor listings with filters (category, city).
- FR-2.4 `/explore` aggregates categories and hubs.
- FR-2.5 `/venue/$id` and `/vendor/$id` show full detail with gallery.

### FR-3 Cart & Checkout
- FR-3.1 Customer can add a venue or listing to cart.
- FR-3.2 `/cart` shows items + computed pricing breakdown.
- FR-3.3 `/checkout` creates a `bookings` row + `booking_items` rows atomically.
- FR-3.4 Pricing engine applies all active `pricing_rules` (`tax_percent`, `fee_flat`, etc.).

### FR-4 Manual Payment Workflow
- FR-4.1 Customer submits transaction reference + screenshot URL on `/my-bookings`.
- FR-4.2 Submission creates a `payment_proofs` row (status `pending`).
- FR-4.3 Admin reviews on `/admin/bookings`; can approve or reject.
- FR-4.4 On approval: insert `transactions` row, increment `bookings.amount_paid`.
- FR-4.5 Booking status auto-advances: `pending → confirmed → completed`.

### FR-5 Profile
- FR-5.1 Customer can view & edit name, phone, city, avatar URL.
- FR-5.2 Profile updates use `upsert` to handle missing rows.

### FR-6 Admin Panel (`/admin/*`)
| Route | Capability |
|-------|------------|
| `/admin` | Dashboard with counts |
| `/admin/venues` | CRUD venues |
| `/admin/listings` | CRUD vendor listings (dropdowns for category/city/vendor) |
| `/admin/vendors` | CRUD vendor profiles |
| `/admin/categories` | CRUD event categories |
| `/admin/albums` & `/admin/photos` | Gallery management |
| `/admin/bookings` | View bookings, approve/reject payment proofs |
| `/admin/transactions` | View all transactions |
| `/admin/pricing` | CRUD pricing rules |
| `/admin/users` | CRUD user roles |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | All DB tables have RLS enabled |
| NFR-2 | Admin checks use `has_role()` SECURITY DEFINER fn — no client-trust |
| NFR-3 | Page load < 2s on 4G (SSR-cached routes) |
| NFR-4 | All forms validate required fields before submit |
| NFR-5 | Admin layout hides public navbar to prevent CSS bleed |
| NFR-6 | Mobile-responsive (Tailwind breakpoints) |
| NFR-7 | Semantic design tokens only — no raw color classes |

---

## 5. External Interfaces

### 5.1 Database
PostgreSQL via Supabase. Schema: `profiles`, `user_roles`, `venues`, `vendor_profiles`, `vendor_listings`, `event_categories`, `albums`, `photos`, `cart_items`, `wishlist_items`, `bookings`, `booking_items`, `transactions`, `payment_proofs`, `pricing_rules`, `enquiries`, `reviews`.

### 5.2 Auth
Supabase Auth (email/password). Session token attached to every server-fn via `attachSupabaseAuth` middleware.

---

## 6. Acceptance Criteria
- All routes render without 404.
- Admin can create a venue, customer can book it, customer can submit payment proof, admin can approve, booking moves to `confirmed`/`completed`.
- Filters on `/venues` and `/vendors` use the same option set as admin form dropdowns (single source: `src/lib/filters.ts`).
