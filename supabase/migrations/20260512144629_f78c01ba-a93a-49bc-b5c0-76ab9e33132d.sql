
INSERT INTO public.profiles (id, email, name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'name', u.email)
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.event_categories (slug, title, icon, sort_order) VALUES
  ('wedding', 'Wedding', 'fa-rings-wedding', 1),
  ('birthday', 'Birthday', 'fa-cake-candles', 2),
  ('corporate', 'Corporate', 'fa-briefcase', 3),
  ('anniversary', 'Anniversary', 'fa-heart', 4),
  ('engagement', 'Engagement', 'fa-ring', 5),
  ('cultural', 'Cultural', 'fa-masks-theater', 6)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.venues (name, city, area, venue_type, description, capacity_min, capacity_max, rooms, veg_price, non_veg_price, rental_price, handpicked, tags, cover_image_url, rating_avg, rating_count)
SELECT * FROM (VALUES
  ('Grand Sonargaon Banquet', 'Dhaka', 'Gulshan', 'banquet_hall', 'Elegant indoor banquet space with chandeliers and stage.', 100, 600, 8, 1200::numeric, 1800::numeric, 90000::numeric, true, ARRAY['AC','Parking','Stage'], 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=900', 4.7::numeric, 124),
  ('Radisson Blu Garden', 'Chittagong', 'Agrabad', 'marriage_garden', 'Open-air marriage garden with floral arches.', 200, 1000, 0, 1100::numeric, 1700::numeric, 120000::numeric, true, ARRAY['Outdoor','Catering'], 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=900', 4.6::numeric, 89),
  ('Sea Pearl Resort', 'Cox''s Bazar', 'Inani Beach', 'resort', 'Beachfront resort suitable for destination weddings.', 50, 300, 60, 1500::numeric, 2200::numeric, 150000::numeric, false, ARRAY['Beach','Rooms','Pool'], 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=900', 4.8::numeric, 56),
  ('Sylhet Tea Hills Hotel', 'Sylhet', 'Lakkatura', 'hotel', '4-star hotel surrounded by tea gardens.', 80, 400, 45, 1000::numeric, 1500::numeric, 80000::numeric, false, ARRAY['Hotel','AC'], 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=900', 4.4::numeric, 42),
  ('City Party Hall Khulna', 'Khulna', 'Sonadanga', 'party_hall', 'Compact party hall ideal for birthdays and small events.', 40, 150, 0, 800::numeric, 1200::numeric, 35000::numeric, false, ARRAY['AC','DJ'], 'https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&q=80&w=900', 4.3::numeric, 31),
  ('Padma Riverside Resort', 'Rajshahi', 'Padma Bank', 'destination', 'Riverside destination venue with full event support.', 100, 500, 30, 1200::numeric, 1900::numeric, 110000::numeric, true, ARRAY['Riverside','Rooms'], 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=900', 4.5::numeric, 67)
) AS v(name, city, area, venue_type, description, capacity_min, capacity_max, rooms, veg_price, non_veg_price, rental_price, handpicked, tags, cover_image_url, rating_avg, rating_count)
WHERE NOT EXISTS (SELECT 1 FROM public.venues x WHERE x.name = v.name);

INSERT INTO public.vendor_profiles (business_name, city, phone, bio, price_from, price_to, verified, categories, service_areas, cover_image_url)
SELECT * FROM (VALUES
  ('Lensview Studio', 'Dhaka', '+8801712000001', 'Award-winning wedding photographers.', 30000::numeric, 150000::numeric, true, ARRAY['photographer'], ARRAY['Dhaka','Sylhet'], 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=900'),
  ('Glow Bridal Makeup', 'Dhaka', '+8801712000002', 'Bridal & party makeup artistry.', 8000::numeric, 45000::numeric, true, ARRAY['makeup'], ARRAY['Dhaka'], 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=900'),
  ('Floral Dreams Decor', 'Chittagong', '+8801712000003', 'Floral and themed event decoration.', 25000::numeric, 200000::numeric, false, ARRAY['decorator'], ARRAY['Chittagong','Dhaka'], 'https://images.unsplash.com/photo-1478146522997-6f2d0285a219?auto=format&fit=crop&q=80&w=900'),
  ('Dhaka Royal Caterers', 'Dhaka', '+8801712000004', 'Multi-cuisine catering with live counters.', 700::numeric, 1800::numeric, true, ARRAY['caterer'], ARRAY['Dhaka','Gazipur'], 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=900')
) AS v(business_name, city, phone, bio, price_from, price_to, verified, categories, service_areas, cover_image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_profiles x WHERE x.business_name = v.business_name);

INSERT INTO public.vendor_listings (vendor_profile_id, title, category, city, description, price_from, price_to, badge, cover_image_url, rating_avg, rating_count, is_active)
SELECT vp.id, t.title, t.category, t.city, t.description, t.price_from, t.price_to, t.badge, t.cover_image_url, t.rating_avg, t.rating_count, true
FROM (VALUES
  ('Lensview Studio', 'Candid Wedding Photography', 'photographer', 'Dhaka', 'Full-day candid + traditional coverage.', 60000::numeric, 150000::numeric, 'Top Rated', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900', 4.8::numeric, 102),
  ('Lensview Studio', 'Pre-Wedding Shoot', 'photographer', 'Dhaka', 'Outdoor pre-wedding photo session.', 30000::numeric, 60000::numeric, NULL, 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900', 4.6::numeric, 41),
  ('Glow Bridal Makeup', 'Bridal Makeup Package', 'makeup', 'Dhaka', 'HD bridal makeup with hairstyling.', 15000::numeric, 45000::numeric, 'Bestseller', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=900', 4.9::numeric, 87),
  ('Floral Dreams Decor', 'Stage & Mandap Decoration', 'decorator', 'Chittagong', 'Floral stage with backdrop and seating.', 40000::numeric, 200000::numeric, NULL, 'https://images.unsplash.com/photo-1478146522997-6f2d0285a219?auto=format&fit=crop&q=80&w=900', 4.5::numeric, 33),
  ('Dhaka Royal Caterers', 'Wedding Buffet (per plate)', 'caterer', 'Dhaka', 'Premium multi-cuisine buffet.', 900::numeric, 1800::numeric, NULL, 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=900', 4.6::numeric, 64),
  ('Dhaka Royal Caterers', 'Corporate Lunch Box', 'caterer', 'Dhaka', 'Office lunch boxes with delivery.', 250::numeric, 600::numeric, NULL, 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=900', 4.4::numeric, 19)
) AS t(business_name, title, category, city, description, price_from, price_to, badge, cover_image_url, rating_avg, rating_count)
JOIN public.vendor_profiles vp ON vp.business_name = t.business_name
WHERE NOT EXISTS (SELECT 1 FROM public.vendor_listings x WHERE x.title = t.title AND x.vendor_profile_id = vp.id);

INSERT INTO public.albums (title, city, featured, cover_image_url)
SELECT * FROM (VALUES
  ('Royal Wedding in Dhaka', 'Dhaka', true, 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900'),
  ('Beachside Engagement', 'Cox''s Bazar', true, 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&q=80&w=900'),
  ('Corporate Gala 2025', 'Chittagong', false, 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900'),
  ('Birthday Bash Sylhet', 'Sylhet', true, 'https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&q=80&w=900')
) AS a(title, city, featured, cover_image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.albums x WHERE x.title = a.title);

INSERT INTO public.photos (title, city, category, image_url)
SELECT * FROM (VALUES
  ('Bride portrait', 'Dhaka', 'wedding', 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900'),
  ('Floral mandap', 'Chittagong', 'wedding', 'https://images.unsplash.com/photo-1478146522997-6f2d0285a219?auto=format&fit=crop&q=80&w=900'),
  ('Birthday cake', 'Sylhet', 'birthday', 'https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&q=80&w=900'),
  ('Beach engagement', 'Cox''s Bazar', 'engagement', 'https://images.unsplash.com/photo-1525258946800-98cfd641d0de?auto=format&fit=crop&q=80&w=900'),
  ('Corporate stage', 'Chittagong', 'corporate', 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=900'),
  ('Reception hall', 'Dhaka', 'wedding', 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=900'),
  ('Catering buffet', 'Dhaka', 'wedding', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=900'),
  ('Cultural dance', 'Rajshahi', 'cultural', 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=900')
) AS p(title, city, category, image_url)
WHERE NOT EXISTS (SELECT 1 FROM public.photos x WHERE x.title = p.title);

INSERT INTO public.pricing_rules (name, rule_type, scope, value, active, notes)
SELECT * FROM (VALUES
  ('VAT 5%', 'tax_percent'::pricing_rule_type, 'all'::pricing_rule_scope, 5::numeric, true, 'Standard VAT'),
  ('Service fee 2%', 'fee_percent'::pricing_rule_type, 'all'::pricing_rule_scope, 2::numeric, true, 'Platform service fee')
) AS r(name, rule_type, scope, value, active, notes)
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules x WHERE x.name = r.name);
