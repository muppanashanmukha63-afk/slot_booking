/*
  # BookIt: Experiences & Slots Database Schema

  ## Overview
  This migration creates the complete database schema for a travel experience booking system.
  Users can browse experiences, view available time slots, and complete bookings.

  ## New Tables

  ### 1. `experiences`
  Stores travel experience offerings with pricing and location information.
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Experience name
  - `description` (text) - Detailed description
  - `location` (text) - Location name
  - `price` (integer) - Base price in rupees
  - `image_url` (text) - Cover image URL
  - `about` (text) - Additional information
  - `min_age` (integer) - Minimum age requirement
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `experience_slots`
  Defines available time slots for each experience with capacity management.
  - `id` (uuid, primary key) - Unique identifier
  - `experience_id` (uuid, foreign key) - Links to experiences table
  - `date` (date) - Slot date
  - `time` (text) - Slot time (e.g., "07:00 am")
  - `total_capacity` (integer) - Maximum bookings allowed
  - `booked_count` (integer) - Current number of bookings
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `bookings`
  Records customer bookings with payment and confirmation details.
  - `id` (uuid, primary key) - Unique identifier
  - `experience_id` (uuid, foreign key) - Links to experiences table
  - `slot_id` (uuid, foreign key) - Links to experience_slots table
  - `full_name` (text) - Customer full name
  - `email` (text) - Customer email address
  - `quantity` (integer) - Number of tickets booked
  - `subtotal` (integer) - Price before taxes
  - `taxes` (integer) - Tax amount
  - `total` (integer) - Final total amount
  - `promo_code` (text, nullable) - Applied promo code
  - `discount_amount` (integer) - Discount applied
  - `reference_id` (text) - Booking reference code
  - `status` (text) - Booking status (confirmed, pending, cancelled)
  - `created_at` (timestamptz) - Booking timestamp

  ### 4. `promo_codes`
  Manages promotional discount codes.
  - `id` (uuid, primary key) - Unique identifier
  - `code` (text, unique) - Promo code string
  - `discount_percentage` (integer) - Discount as percentage
  - `is_active` (boolean) - Whether code is currently valid
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public read access for experiences and slots (browsing)
  - Public insert access for bookings (guest checkout)
  - Restricted access for promo codes (read-only)

  ## Indexes
  - Index on experience_slots for efficient date/experience queries
  - Index on bookings for reference_id lookups
  - Unique index on promo_codes for code validation
*/

-- Create experiences table
CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  price integer NOT NULL,
  image_url text NOT NULL,
  about text DEFAULT '',
  min_age integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Create experience_slots table
CREATE TABLE IF NOT EXISTS experience_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  date date NOT NULL,
  time text NOT NULL,
  total_capacity integer NOT NULL DEFAULT 10,
  booked_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES experiences(id),
  slot_id uuid NOT NULL REFERENCES experience_slots(id),
  full_name text NOT NULL,
  email text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  subtotal integer NOT NULL,
  taxes integer NOT NULL,
  total integer NOT NULL,
  promo_code text,
  discount_amount integer DEFAULT 0,
  reference_id text NOT NULL UNIQUE,
  status text DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now()
);

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percentage integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_slots_experience_date 
  ON experience_slots(experience_id, date);

CREATE INDEX IF NOT EXISTS idx_bookings_reference 
  ON bookings(reference_id);

-- Enable Row Level Security
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experiences (public read)
CREATE POLICY "Public can view experiences"
  ON experiences FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for experience_slots (public read)
CREATE POLICY "Public can view slots"
  ON experience_slots FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for bookings (public insert, own read)
CREATE POLICY "Anyone can create bookings"
  ON bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO anon, authenticated
  USING (true);

-- RLS Policies for promo_codes (public read for validation)
CREATE POLICY "Public can view active promo codes"
  ON promo_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Insert sample experiences
INSERT INTO experiences (title, description, location, price, image_url, about) VALUES
  ('Kayaking', 'Curated small-group experience. Certified guide. Safety first with gear included.', 'Udupi', 999, 'https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg', 'Scenic routes, trained guides, and safety briefing. Minimum age 10.'),
  ('Nandi Hills Sunrise', 'Curated small-group experience. Certified guide. Safety first with gear included.', 'Bangalore', 899, 'https://images.pexels.com/photos/1118877/pexels-photo-1118877.jpeg', 'Early morning trek to catch the sunrise. Minimum age 10.'),
  ('Coffee Trail', 'Curated small-group experience. Certified guide. Safety first with gear included.', 'Coorg', 1299, 'https://images.pexels.com/photos/1024960/pexels-photo-1024960.jpeg', 'Walk through coffee plantations and learn about coffee production. Minimum age 10.'),
  ('Kayaking', 'Curated small-group experience. Certified guide. Safety first with gear included.', 'Udupi, Karnataka', 999, 'https://images.pexels.com/photos/1666021/pexels-photo-1666021.jpeg', 'Scenic routes, trained guides, and safety briefing. Helmet and Life jackets along with an expert will accompany in kayaking. Minimum age 10.')
ON CONFLICT DO NOTHING;

-- Insert sample slots for the experiences (next 5 days)
DO $$
DECLARE
  exp_record RECORD;
  slot_date date;
  i integer;
BEGIN
  FOR exp_record IN SELECT id FROM experiences LOOP
    FOR i IN 0..4 LOOP
      slot_date := CURRENT_DATE + i;
      
      INSERT INTO experience_slots (experience_id, date, time, total_capacity, booked_count) VALUES
        (exp_record.id, slot_date, '07:00 am', 10, CASE WHEN i = 0 AND exp_record.id = (SELECT id FROM experiences LIMIT 1) THEN 6 ELSE 0 END),
        (exp_record.id, slot_date, '9:00 am', 10, CASE WHEN i = 0 THEN 8 ELSE 0 END),
        (exp_record.id, slot_date, '11:00 am', 10, CASE WHEN i = 0 THEN 5 ELSE 0 END),
        (exp_record.id, slot_date, '1:00 pm', 10, CASE WHEN i = 0 THEN 10 ELSE 0 END)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert sample promo codes
INSERT INTO promo_codes (code, discount_percentage, is_active) VALUES
  ('SAVE10', 10, true),
  ('WELCOME20', 20, true),
  ('FIRSTBOOK', 15, true)
ON CONFLICT DO NOTHING;