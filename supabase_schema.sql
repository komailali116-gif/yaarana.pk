-- Create payment_requests table in Supabase
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

-- Enable Row Level Security (RLS)
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own payment requests
CREATE POLICY "Users can insert their own payment requests" 
ON payment_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own payment requests
CREATE POLICY "Users can view their own payment requests" 
ON payment_requests 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy: Admins can view all payment requests
CREATE POLICY "Admins can view all payment requests" 
ON payment_requests 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);

-- Policy: Admins can update all payment requests
CREATE POLICY "Admins can update all payment requests" 
ON payment_requests 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
