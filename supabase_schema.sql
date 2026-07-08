-- ==========================================
-- YARANA.PK COMPLETE SUPABASE DATABASE SCHEMA
-- ==========================================
-- This script sets up all database tables and configures optimal, non-recursive 
-- Row Level Security (RLS) policies to ensure security, safety, and compliance.

-- Admin Email: komailali116@gmail.com

-- --------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  city text DEFAULT 'Lahore',
  avatar text DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  is_admin boolean DEFAULT false NOT NULL,
  selected_role text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
  FOR UPDATE USING ((auth.jwt() ->> 'email') = 'komailali116@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'komailali116@gmail.com');

DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile" ON profiles
  FOR DELETE USING ((auth.jwt() ->> 'email') = 'komailali116@gmail.com');


-- --------------------------------------------------
-- 2. COMPANIONS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS companions (
  id text PRIMARY KEY,
  name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  city text NOT NULL,
  avatar text,
  bio text,
  rating numeric DEFAULT 5.0,
  reviews_count integer DEFAULT 0,
  languages text[] DEFAULT '{}'::text[],
  interests text[] DEFAULT '{}'::text[],
  services text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'Approved',
  is_online boolean DEFAULT true NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  tagline text,
  cnic text,
  mobile text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;

-- Companions Policies
DROP POLICY IF EXISTS "Companions are viewable by everyone" ON companions;
CREATE POLICY "Companions are viewable by everyone" ON companions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can onboard themselves as companions" ON companions;
CREATE POLICY "Authenticated users can onboard themselves as companions" ON companions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL OR (auth.jwt() ->> 'email') = 'komailali116@gmail.com');

DROP POLICY IF EXISTS "Companions can update their own profile" ON companions;
CREATE POLICY "Companions can update their own profile" ON companions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full write access on companions" ON companions;
CREATE POLICY "Admins have full write access on companions" ON companions
  FOR ALL TO authenticated USING ((auth.jwt() ->> 'email') = 'komailali116@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'komailali116@gmail.com');


-- --------------------------------------------------
-- 3. BOOKINGS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id text PRIMARY KEY,
  companion_id text REFERENCES companions(id) ON DELETE CASCADE,
  companion_name text NOT NULL,
  companion_avatar text,
  service_id text NOT NULL,
  service_name text NOT NULL,
  date text NOT NULL,
  time text NOT NULL,
  duration integer NOT NULL,
  total_price numeric NOT NULL,
  status text NOT NULL DEFAULT 'paid',
  payment_method text,
  payment_number text,
  meeting_location_type text,
  meeting_address text,
  meeting_instructions text,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Bookings Policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Companions can view bookings assigned to them" ON bookings;
CREATE POLICY "Companions can view bookings assigned to them" ON bookings
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM companions 
      WHERE companions.id = bookings.companion_id AND companions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access on bookings" ON bookings;
CREATE POLICY "Admins have full access on bookings" ON bookings
  FOR ALL TO authenticated USING ((auth.jwt() ->> 'email') = 'komailali116@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'komailali116@gmail.com');


-- --------------------------------------------------
-- 4. REVIEWS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id text PRIMARY KEY,
  companion_id text REFERENCES companions(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  user_avatar text,
  rating numeric NOT NULL,
  comment text NOT NULL,
  date text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Reviews Policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews" ON reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;
CREATE POLICY "Admins can manage reviews" ON reviews
  FOR ALL TO authenticated USING ((auth.jwt() ->> 'email') = 'komailali116@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'komailali116@gmail.com');


-- --------------------------------------------------
-- 5. PAYMENT_REQUESTS TABLE
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  companion_id text NOT NULL,
  companion_name text NOT NULL,
  companion_avatar text,
  service_id text NOT NULL,
  service_name text NOT NULL,
  booking_date text NOT NULL,
  booking_time text NOT NULL,
  duration integer NOT NULL,
  total_price numeric NOT NULL,
  meeting_location_type text,
  meeting_address text,
  meeting_instructions text,
  transaction_id text,
  last_four text NOT NULL,
  payment_note text,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Payment Requests Policies
DROP POLICY IF EXISTS "Users can view their own payment requests" ON payment_requests;
CREATE POLICY "Users can view their own payment requests" ON payment_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payment requests" ON payment_requests;
CREATE POLICY "Users can insert their own payment requests" ON payment_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all payment requests" ON payment_requests;
CREATE POLICY "Admins can manage all payment requests" ON payment_requests
  FOR ALL TO authenticated USING ((auth.jwt() ->> 'email') = 'komailali116@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'komailali116@gmail.com');


-- --------------------------------------------------
-- 6. ADMIN_MESSAGES TABLE (SUPPORT CHATS)
-- --------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_messages (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  sender_email text NOT NULL,
  sender_name text NOT NULL,
  message text NOT NULL,
  is_admin boolean DEFAULT false NOT NULL,
  recipient_email text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Admin Messages Policies
DROP POLICY IF EXISTS "Users can view their own chat messages" ON admin_messages;
CREATE POLICY "Users can view their own chat messages" ON admin_messages
  FOR SELECT TO authenticated USING (
    sender_email = (auth.jwt() ->> 'email') OR 
    recipient_email = (auth.jwt() ->> 'email') OR
    user_id = auth.uid()::text
  );

DROP POLICY IF EXISTS "Anyone can insert a support chat message" ON admin_messages;
CREATE POLICY "Anyone can insert a support chat message" ON admin_messages
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins have full access on support chat messages" ON admin_messages;
CREATE POLICY "Admins have full access on support chat messages" ON admin_messages
  FOR ALL TO authenticated USING ((auth.jwt() ->> 'email') = 'komailali116@gmail.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'komailali116@gmail.com');


-- --------------------------------------------------
-- 7. STORAGE BUCKET CONFIGURATION (GUIDANCE)
-- --------------------------------------------------
-- To set up the storage bucket 'app-files' in Supabase, create a public bucket named 'app-files'
-- and apply these policies to target the objects table inside storage schema:
--
-- CREATE POLICY "Give public select access to app-files bucket" ON storage.objects
--   FOR SELECT USING (bucket_id = 'app-files');
--
-- CREATE POLICY "Give authenticated users write access to app-files bucket" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (bucket_id = 'app-files' AND auth.uid()::text = (storage.foldername(name))[1]);
