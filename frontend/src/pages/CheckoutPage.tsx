import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BookingData } from "./DetailsPage";

interface CheckoutPageProps {
  bookingData: BookingData;
  onBack: () => void;
  onSuccess: (referenceId: string) => void;
  onError: () => void;
}

export default function CheckoutPage({
  bookingData,
  onBack,
  onSuccess,
  onError,
}: CheckoutPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  // 💰 Calculate pricing
  const subtotal = bookingData.subtotal;
  const discountAmount = Math.round(subtotal * (discount / 100));
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxes = Math.round(subtotalAfterDiscount * 0.05);
  const total = subtotalAfterDiscount + taxes;

  // 🗓️ Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 🎟️ Apply promo code (from backend)
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      });
      console.log("Promo code response:", response);

      const data = await response.json();

      if (!response.ok || !data.valid) {
        setPromoError("Invalid or expired promo code");
        setDiscount(0);
        setPromoApplied(false);
        return;
      }

      setDiscount(data.discount_percentage);
      setPromoError("");
      setPromoApplied(true);
    } catch (error) {
      console.error("Promo validation error:", error);
      setPromoError("Error validating promo code");
    }
  };

  // 🧾 Submit booking to backend
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!agreedToTerms) {
      alert("Please agree to the terms and safety policy");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experienceId: bookingData.experience.id,
          slotId: bookingData.slot.id,
          fullName,
          email,
          quantity: bookingData.quantity,
          subtotal: subtotalAfterDiscount,
          taxes,
          total,
          promoCode: promoApplied ? promoCode.toUpperCase() : null,
          discountAmount,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onSuccess(result.booking.reference_id);
      } else {
        console.error("Booking failed:", result);
        onError();
      }
    } catch (error) {
      console.error("Booking error:", error);
      onError();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Checkout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    required
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="test@test.com"
                    required
                    className="w-full px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Promo code
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoError("");
                      setPromoApplied(false);
                      setDiscount(0);
                    }}
                    placeholder="Enter code"
                    disabled={promoApplied}
                    className="flex-1 px-4 py-3 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoApplied}
                    className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {promoApplied ? "Applied" : "Apply"}
                  </button>
                </div>
                {promoError && <p className="text-sm text-red-500 mt-2">{promoError}</p>}
                {promoApplied && (
                  <p className="text-sm text-green-600 mt-2">
                    Promo code applied! {discount}% discount
                  </p>
                )}
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-yellow-400 border-gray-300 rounded focus:ring-yellow-400"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the terms and safety policy
                  </span>
                </label>
              </div>
            </form>
          </div>

          {/* Right: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience</span>
                  <span className="text-gray-900 font-medium">
                    {bookingData.experience.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date</span>
                  <span className="text-gray-900 font-medium">
                    {formatDate(bookingData.slot.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="text-gray-900 font-medium">
                    {bookingData.slot.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Qty</span>
                  <span className="text-gray-900 font-medium">
                    {bookingData.quantity}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-green-600 font-medium">-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Taxes</span>
                  <span className="text-gray-900 font-medium">₹{taxes}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !agreedToTerms}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  loading || !agreedToTerms
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-yellow-400 hover:bg-yellow-500 text-black"
                }`}
              >
                {loading ? "Processing..." : "Pay and Confirm"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
