## Issues found

### 1. Double navbar on `/profile`
`src/routes/__root.tsx` already wraps every route in `<Layout>`. `src/routes/profile.tsx` *also* imports and wraps its content in `<Layout>`, so the navbar + bottom-nav render twice. Fix: remove the inner `<Layout>` wrapper from `profile.tsx` (use a plain `<div>`/fragment).

### 2. "Infinite recursion" error on bookings
The current RLS is mutually recursive:

- `bookings_self_select` on **bookings** does `EXISTS (SELECT … FROM booking_items JOIN vendor_listings JOIN vendor_profiles …)`
- `booking_items_select` on **booking_items** does `EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_items.booking_id …)`

Postgres evaluates the policy on `booking_items` while resolving the policy on `bookings`, which re-triggers the bookings policy → recursion error every time `/my-bookings` loads (it queries bookings + nested booking_items).

**Fix (migration):** add two `SECURITY DEFINER` helpers that bypass RLS for the inner lookup, then rewrite both policies to use them.

```text
public.user_owns_booking(_booking_id uuid)        -- SELECT 1 FROM bookings WHERE id=_booking_id AND user_id=auth.uid()
public.is_vendor_for_booking(_booking_id uuid)    -- SELECT 1 FROM booking_items+vendor_listings+vendor_profiles
```

Then:
- `bookings_self_select` → `user_id = auth.uid() OR has_role(auth.uid(),'admin') OR public.is_vendor_for_booking(id)`
- `booking_items_select` → `public.user_owns_booking(booking_id) OR has_role(...) OR (target_type='vendor' AND vendor-owns-listing check via definer)`

Definer functions break the recursion because they don't re-run RLS.

### 3. Bangladesh-local city/type filters everywhere

Make `src/lib/filters.ts` the single source for both user-side filter chips and admin form dropdowns, and ensure data is stored using the canonical enum-like values so filtering actually matches.

**Changes:**
- `src/routes/venues.tsx` — replace inline `CITIES`/`TYPES` arrays with imports from `@/lib/filters` (`CITIES`, `VENUE_TYPES`). Add an "All" sentinel locally. This guarantees the chips on the user side use exactly the same values stored by the admin form.
- `src/routes/vendors.tsx` — already uses shared `CITIES`/`VENDOR_CATEGORIES`; just verify no drift.
- Admin forms already use dropdowns (`admin.venues.tsx`, `admin.vendors.tsx`, `admin.listings.tsx`, `admin.photos.tsx`). Confirmed correct — no edit needed there beyond verifying labels.
- Add an `area` text field next to city on the venues page for finer "local area" filtering (city = Dhaka, area = Gulshan/Banani, etc.). Wired to existing `venues.area` column already in the schema. `loadVenues` already supports a free-form area filter via the search path; if not, extend it to filter `area ILIKE %q%`.

## Files to change

1. `src/routes/profile.tsx` — remove inner `<Layout>` wrapper.
2. `supabase/migrations/<new>.sql` — add `user_owns_booking` + `is_vendor_for_booking` SECURITY DEFINER functions; drop & recreate `bookings_self_select` and `booking_items_select` policies to use them.
3. `src/routes/venues.tsx` — import shared `CITIES`/`VENUE_TYPES` from `@/lib/filters`; add optional `area` input bound to `loadVenues({ area })`.
4. `src/lib/data.ts` — extend `loadVenues` signature with `area?: string` and apply `.ilike("area", `%${area}%`)` when provided.
5. `README.md` / `docs/SRS.md` — short note about the RLS fix and the shared filter source-of-truth (one paragraph each).

## Verification steps

- Visit `/profile` → only one navbar/bottom-nav.
- Log in as a customer with at least one booking → `/my-bookings` loads without `infinite recursion detected in policy` (check console + network tab).
- On `/venues`, switching city + venue type chips returns matching rows that were created via the admin dropdowns (proves stored values align).
- On `/admin/venues` create a new venue with city "Dhaka" + type "banquet_hall" → it appears on `/venues` when those chips are selected.
