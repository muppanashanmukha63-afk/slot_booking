import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateReferenceId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      experienceId, 
      slotId, 
      fullName, 
      email, 
      quantity, 
      subtotal, 
      taxes, 
      total,
      promoCode,
      discountAmount 
    } = await req.json();

    const { data: slot, error: slotError } = await supabase
      .from("experience_slots")
      .select("*")
      .eq("id", slotId)
      .maybeSingle();

    if (slotError || !slot) {
      return new Response(
        JSON.stringify({ error: "Slot not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const availableCapacity = slot.total_capacity - slot.booked_count;
    if (availableCapacity < quantity) {
      return new Response(
        JSON.stringify({ error: "Not enough capacity available" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const referenceId = generateReferenceId();

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        experience_id: experienceId,
        slot_id: slotId,
        full_name: fullName,
        email: email,
        quantity: quantity,
        subtotal: subtotal,
        taxes: taxes,
        total: total,
        promo_code: promoCode || null,
        discount_amount: discountAmount || 0,
        reference_id: referenceId,
        status: "confirmed",
      })
      .select()
      .single();

    if (bookingError) {
      return new Response(
        JSON.stringify({ error: bookingError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateError } = await supabase
      .from("experience_slots")
      .update({ booked_count: slot.booked_count + quantity })
      .eq("id", slotId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: updateError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, booking }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});