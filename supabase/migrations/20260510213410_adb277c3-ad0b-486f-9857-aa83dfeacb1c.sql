
-- =========================================================================
-- ENUMS
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('admin','vendor','customer');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','cancelled','completed','refunded');
CREATE TYPE public.transaction_status AS ENUM ('initiated','success','failed','refunded');
CREATE TYPE public.target_kind AS ENUM ('venue','vendor');
CREATE TYPE public.pricing_rule_type AS ENUM ('discount_percent','discount_flat','tax_percent','fee_flat','fee_percent');
CREATE TYPE public.pricing_rule_scope AS ENUM ('all','venue','vendor');

-- =========================================================================
-- PROFILES + ROLES
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================================
-- CONTENT TABLES
-- =========================================================================
CREATE TABLE public.event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  city TEXT,
  area TEXT,
  address TEXT,
  venue_type TEXT,
  tags TEXT[] DEFAULT '{}',
  handpicked BOOLEAN NOT NULL DEFAULT FALSE,
  veg_price NUMERIC,
  non_veg_price NUMERIC,
  rental_price NUMERIC,
  capacity_min INT,
  capacity_max INT,
  rooms INT,
  rating_avg NUMERIC NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  gallery_image_urls TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER venues_touch BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_venues_city ON public.venues(city);
CREATE INDEX idx_venues_type ON public.venues(venue_type);

CREATE TABLE public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  service_areas TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  price_from NUMERIC,
  price_to NUMERIC,
  cover_image_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER vendor_profiles_touch BEFORE UPDATE ON public.vendor_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.vendor_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_profile_id UUID REFERENCES public.vendor_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  city TEXT,
  price_from NUMERIC,
  price_to NUMERIC,
  rating_avg NUMERIC NOT NULL DEFAULT 0,
  rating_count INT NOT NULL DEFAULT 0,
  cover_image_url TEXT,
  gallery_image_urls TEXT[] DEFAULT '{}',
  badge TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER vendor_listings_touch BEFORE UPDATE ON public.vendor_listings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_vendor_listings_city ON public.vendor_listings(city);
CREATE INDEX idx_vendor_listings_category ON public.vendor_listings(category);

CREATE TABLE public.albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  city TEXT,
  cover_image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES public.albums(id) ON DELETE SET NULL,
  title TEXT,
  category TEXT,
  city TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- WISHLIST / REVIEWS / ENQUIRIES
-- =========================================================================
CREATE TABLE public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.target_kind NOT NULL,
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.target_kind NOT NULL,
  target_id UUID NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT,
  target_id UUID,
  name TEXT,
  email TEXT,
  phone TEXT,
  event_date DATE,
  guest_count INT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- CART
-- =========================================================================
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.target_kind NOT NULL,
  target_id UUID NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- =========================================================================
-- PRICING RULES
-- =========================================================================
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type public.pricing_rule_type NOT NULL,
  scope public.pricing_rule_scope NOT NULL DEFAULT 'all',
  value NUMERIC NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER pricing_rules_touch BEFORE UPDATE ON public.pricing_rules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- =========================================================================
-- BOOKINGS / ORDERS
-- =========================================================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.booking_status NOT NULL DEFAULT 'pending',
  receipt_number TEXT UNIQUE NOT NULL,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_total NUMERIC NOT NULL DEFAULT 0,
  tax_total NUMERIC NOT NULL DEFAULT 0,
  fee_total NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  deposit_amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BDT',
  event_date DATE,
  guest_count INT,
  contact_phone TEXT,
  notes TEXT,
  payment_method TEXT,
  payment_type TEXT NOT NULL DEFAULT 'deposit',
  pricing_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);

CREATE TABLE public.booking_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  target_type public.target_kind NOT NULL,
  target_id UUID NOT NULL,
  title_snapshot TEXT NOT NULL,
  image_snapshot TEXT,
  unit_price NUMERIC NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  line_total NUMERIC NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_booking_items_booking ON public.booking_items(booking_id);
CREATE INDEX idx_booking_items_target ON public.booking_items(target_type, target_id);

CREATE TABLE public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  reference TEXT,
  amount NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway TEXT NOT NULL DEFAULT 'manual',
  reference TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status public.transaction_status NOT NULL DEFAULT 'initiated',
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER transactions_touch BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_transactions_booking ON public.transactions(booking_id);

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- profiles: own + admin
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_admin_all"   ON public.profiles FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles: user can see own; only admin manages
CREATE POLICY "user_roles_self_select" ON public.user_roles FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "user_roles_admin_all"   ON public.user_roles FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- public read tables
CREATE POLICY "event_categories_public_read" ON public.event_categories FOR SELECT USING (TRUE);
CREATE POLICY "event_categories_admin_all"   ON public.event_categories FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "venues_public_read" ON public.venues FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "venues_admin_all"   ON public.venues FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "vendor_profiles_public_read" ON public.vendor_profiles FOR SELECT USING (TRUE);
CREATE POLICY "vendor_profiles_self_update" ON public.vendor_profiles FOR UPDATE USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "vendor_profiles_admin_all"   ON public.vendor_profiles FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "vendor_listings_public_read" ON public.vendor_listings FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "vendor_listings_admin_all"   ON public.vendor_listings FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "albums_public_read" ON public.albums FOR SELECT USING (TRUE);
CREATE POLICY "albums_admin_all"   ON public.albums FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "photos_public_read" ON public.photos FOR SELECT USING (TRUE);
CREATE POLICY "photos_admin_all"   ON public.photos FOR ALL    USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- wishlist: own
CREATE POLICY "wishlist_self_all" ON public.wishlist_items FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "wishlist_admin_read" ON public.wishlist_items FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- reviews
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "reviews_self_insert" ON public.reviews FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "reviews_self_update" ON public.reviews FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "reviews_self_delete" ON public.reviews FOR DELETE USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_admin_all"   ON public.reviews FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- enquiries
CREATE POLICY "enquiries_self_insert" ON public.enquiries FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "enquiries_self_select" ON public.enquiries FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "enquiries_admin_all"   ON public.enquiries FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- cart_items: own only
CREATE POLICY "cart_self_all" ON public.cart_items FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- pricing_rules: anyone can read active rules; admins manage
CREATE POLICY "pricing_rules_read" ON public.pricing_rules FOR SELECT USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pricing_rules_admin_all" ON public.pricing_rules FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- bookings: own; admin all; vendors see bookings containing their listings
CREATE POLICY "bookings_self_select" ON public.bookings FOR SELECT USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR EXISTS (
    SELECT 1 FROM public.booking_items bi
    JOIN public.vendor_listings vl ON vl.id = bi.target_id AND bi.target_type = 'vendor'
    JOIN public.vendor_profiles vp ON vp.id = vl.vendor_profile_id
    WHERE bi.booking_id = bookings.id AND vp.user_id = auth.uid()
  )
);
CREATE POLICY "bookings_self_insert" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bookings_admin_all"   ON public.bookings FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "booking_items_select" ON public.booking_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_items.booking_id
          AND (b.user_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
  OR (target_type = 'vendor' AND EXISTS (
    SELECT 1 FROM public.vendor_listings vl
    JOIN public.vendor_profiles vp ON vp.id = vl.vendor_profile_id
    WHERE vl.id = booking_items.target_id AND vp.user_id = auth.uid()
  ))
);
CREATE POLICY "booking_items_self_insert" ON public.booking_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_items.booking_id AND b.user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "booking_items_admin_all" ON public.booking_items FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "payment_proofs_self_all" ON public.payment_proofs FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "payment_proofs_admin_all" ON public.payment_proofs FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "transactions_self_select" ON public.transactions FOR SELECT USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "transactions_self_insert" ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "transactions_admin_all"   ON public.transactions FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
