# Fix Plan: Routes, Admin UX, Listings, Profile & QA

## Issues found

1. **`/vendors` and `/explore` 404** — `src/components/Layout.tsx` links to them but neither route file exists (only `vendor.$id.tsx` exists). Session replay confirms a 404 on click.
2. **Admin "Vendor Listings" form uses free-text inputs** for `category`, `city`, and `vendor_profile_id` — should be **dropdowns** populated from the same source the user-side filters use (cities, vendor categories, existing vendor profiles).
3. **User-side listing cards missing info** — `cards.tsx` doesn't render category/price-from/badge cleanly; Vendor card likely lacks fallback fields.
4. **Profile** — route exists but profile DB row may not exist for older users (the `handle_new_user` trigger only fires for new sign-ups). Need a defensive upsert in `getMyProfile` / `updateMyProfile`.
5. **Admin panel CSS bleed** — admin uses the global `Layout` navbar styles plus inline styles, and `style.css` rules leak in (e.g. `.filter-bar` from public CSS). Need to scope admin styling and stop including the public navbar inside admin pages.
6. **No data in DB** — every network call returns `[]` (venues, albums, photos). Need seed data so the app is testable.
7. **Documentation** — README needs to be updated with all the new fixes, blackbox QA results, and the admin setup guide.

## What I'll change

### Routes (frontend only)
- Create **`src/routes/vendors.tsx`** — list `vendor_listings` with filters (category, city, sort) using `loadVendors()`.
- Create **`src/routes/explore.tsx`** — combined hub linking to Venues, Vendors, Photos, Categories with quick search.

### Admin
- Refactor **`src/routes/admin.listings.tsx`** to pass a new `options` prop into `CrudTable` for select fields:
  - `category` → dropdown from `event_categories.title` (or a static `VENDOR_CATEGORIES` list mirroring user-side filter chips).
  - `city` → dropdown from a shared `CITIES` constant (Dhaka, Chittagong, …).
  - `vendor_profile_id` → dropdown from `vendor_profiles` (id → business_name).
- Extend **`src/components/admin/CrudTable.tsx`** field schema with `type: "select"` + `options` (static array or async loader).
- Apply same pattern to `admin.venues.tsx` (city, venue_type) and `admin.vendors.tsx` (city, categories).
- Wrap admin pages in a scoped CSS class so global `style.css` rules don't bleed (add `.admin-scope` reset and ensure `Layout` navbar isn't rendered inside `/admin/*`).

### User-side cards
- Update **`src/components/cards.tsx`** `VendorCardView` and `VenueCardView` to show: title, category/type, city, price-from, rating, badge, with safe fallbacks ("Price on request", "—").

### Profile
- In `src/lib/data.ts` `getMyProfile`: if no row exists, upsert a default row from `auth.user` so legacy users get a profile.
- Add `email` field display (read-only) and validation.

### Database (migration)
- Seed data: add ~6 venues, ~6 vendor_profiles + listings, ~8 photos, ~4 albums, ~6 event_categories, 2 sample pricing_rules.
- Add a one-shot backfill: `INSERT INTO profiles (id, email, name) SELECT id, email, raw_user_meta_data->>'name' FROM auth.users ON CONFLICT DO NOTHING;`

### Documentation
- Update **README.md** with:
  - Updated route map (incl. `/vendors`, `/explore`, `/profile`).
  - Admin setup guide (promote first admin SQL).
  - Filter / dropdown source-of-truth list.
  - Blackbox QA checklist + results table (each route, expected vs actual, pass/fail).
  - Troubleshooting section (empty data → run seed; missing profile → backfill SQL).

### Blackbox QA pass
Use the in-sandbox browser to walk: `/`, `/venues`, `/vendors`, `/explore`, `/photos`, `/cart`, `/checkout`, `/my-bookings`, `/profile`, `/admin` and every admin sub-route. Capture screenshots, console + network errors, and record results in README.

## Out of scope
- Real payment gateway integration (kept manual/`mark paid`).
- Vendor self-serve onboarding portal (admin-managed only for now).

## Technical notes
- No backend logic changes to pricing/ordering — only data & UI.
- `CrudTable` schema gets one new optional field type; existing routes keep working unchanged.
- All seed inserts use `ON CONFLICT DO NOTHING` so re-running is safe.
