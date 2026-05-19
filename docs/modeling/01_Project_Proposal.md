# Project Proposal
## Event & Venue Booking Platform (Bangladesh)

**Version:** 1.0  
**Date:** May 19, 2026  
**Prepared for:** Academic / Stakeholder Review

---

## 1. Introduction
The Event & Venue Booking Platform is a web application that connects customers in Bangladesh with wedding/event venues and service vendors (photographers, decorators, caterers, DJs, planners, etc.). Customers can discover, filter, cart, book, and pay for services; vendors and administrators manage their listings and confirm bookings through a dedicated admin panel.

## 2. Problem Statement
Event planning in Bangladesh is currently fragmented across Facebook pages, WhatsApp groups, and word-of-mouth. There is no single trusted catalogue with transparent pricing, verified vendors, location-aware filtering (Dhaka, Chittagong, Sylhet, etc.), and a structured payment-proof workflow suited to local payment methods (bKash, Nagad, bank transfer).

## 3. Objectives
1. Provide a unified catalogue of venues and vendors filterable by **city, area, type, and category** based on Bangladesh-specific options.
2. Offer a cart + checkout flow with a configurable pricing engine (taxes, fees, discounts).
3. Support **manual payment verification** through proof submission and admin approval.
4. Deliver a secure, role-based admin panel for full CRUD of every entity.
5. Enforce data security through Postgres Row-Level Security and SECURITY DEFINER helpers.

## 4. Scope
**In-scope:** Public catalogue, auth, cart, checkout, payment-proof workflow, profile, reviews, admin panel (venues, listings, vendors, categories, albums/photos, bookings, transactions, pricing rules, user roles).  
**Out-of-scope (MVP):** Online payment gateway integration, vendor self-service portal, chat/messaging, mobile native apps.

## 5. Target Users
- **Customers** — couples, event organizers planning weddings/parties.
- **Vendors** — registered service providers.
- **Admins** — platform operators.

## 6. Proposed Solution
A single-page application built with **TanStack Start v1, React 19, Tailwind v4** on the frontend and **Lovable Cloud (Supabase / Postgres)** on the backend. Server-side logic uses TanStack `createServerFn`. Authentication is email/password through Supabase Auth.

## 7. Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | TanStack Start v1, React 19, Vite 7, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, semantic design tokens |
| Backend | Lovable Cloud (Supabase Postgres + Auth + Storage) |
| Server logic | TanStack `createServerFn` on Cloudflare Workers |
| Security | RLS, `has_role()` SECURITY DEFINER, recursion-safe helpers |

## 8. Key Features
- Bangladesh-local filters (10 cities + area free-text + 6 venue types + 7 vendor categories).
- Cart + dynamic pricing engine (percent/flat tax, fee, discount rules).
- Manual payment proof workflow (submit → review → approve → auto-confirm).
- Admin dashboard with dropdown-driven CRUD across all tables.
- Profile management with avatar, phone, city.

## 9. Deliverables
1. Working web application (deployed on Lovable Cloud).
2. Software Requirements Specification (SRS).
3. Data Flow Diagrams (Level 0, 1, 2).
4. UML diagrams: Use Case, Class, State, Sequence (this document set).
5. ER Diagram of the Postgres schema.
6. User-facing README and inline code documentation.

## 10. Timeline (indicative)
| Phase | Duration |
|-------|----------|
| Requirements & Design | 1 week |
| Database & Auth | 1 week |
| Catalogue + Cart | 2 weeks |
| Checkout + Payment workflow | 1 week |
| Admin Panel | 2 weeks |
| Testing & Documentation | 1 week |

## 11. Success Criteria
- Customer can complete the full journey: browse → cart → checkout → submit payment proof → see booking confirmed.
- Admin can manage every entity without writing SQL.
- All tables have RLS; no recursion errors; no privilege escalation paths.
- Filters on `/venues` and `/vendors` match values stored from admin dropdowns.

## 12. Risks & Mitigation
| Risk | Mitigation |
|------|------------|
| Manual payment fraud | Required screenshot + reference + admin review |
| RLS policy recursion | SECURITY DEFINER helper functions |
| Filter drift between admin & user | Single source of truth in `src/lib/filters.ts` |
| Privilege escalation | Roles stored in dedicated `user_roles` table |
