REVOKE EXECUTE ON FUNCTION public.user_owns_booking(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_vendor_for_booking(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.vendor_owns_listing(uuid) FROM PUBLIC, anon;
