import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  image_url: string;
  about: string;
  min_age: number;
  created_at: string;
}

export interface ExperienceSlot {
  id: string;
  experience_id: string;
  date: string;
  time: string;
  total_capacity: number;
  booked_count: number;
  created_at: string;
}

export interface Booking {
  id: string;
  experience_id: string;
  slot_id: string;
  full_name: string;
  email: string;
  quantity: number;
  subtotal: number;
  taxes: number;
  total: number;
  promo_code: string | null;
  discount_amount: number;
  reference_id: string;
  status: string;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
}
