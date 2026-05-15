-- Fix infinite recursion between bookings <-> booking_items RLS policies
-- using SECURITY DEFINER helpers that bypass RLS for the inner lookup.

CREATE OR REPLACE FUNCTION public.user_owns_booking(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = _booking_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.is_vendor_for_booking(_booking_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.booking_items bi
    JOIN public.vendor_listings vl ON vl.id = bi.target_id AND bi.target_type = 'vendor'
    JOIN public.vendor_profiles vp ON vp.id = vl.vendor_profile_id
    WHERE bi.booking_id = _booking_id AND vp.user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.vendor_owns_listing(_listing_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_listings vl
    JOIN public.vendor_profiles vp ON vp.id = vl.vendor_profile_id
    WHERE vl.id = _listing_id AND vp.user_id = auth.uid()
  )
$$;

DROP POLICY IF EXISTS bookings_self_select ON public.bookings;
CREATE POLICY bookings_self_select ON public.bookings
  FOR SELECT USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR public.is_vendor_for_booking(id)
  );

DROP POLICY IF EXISTS booking_items_select ON public.booking_items;
CREATE POLICY booking_items_select ON public.booking_items
  FOR SELECT USING (
    public.user_owns_booking(booking_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (target_type = 'vendor'::target_kind AND public.vendor_owns_listing(target_id))
  );
