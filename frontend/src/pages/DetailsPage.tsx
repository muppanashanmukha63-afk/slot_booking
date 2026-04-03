import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, Search } from "lucide-react";

// ✅ Define types
export interface Experience {
  _id: string;
  title: string;
  description: string;
  about?: string;
  price: number;
  location: string;
  image_url: string;
}

export interface ExperienceSlot {
  _id: string;
  experience_id: string | number;
  date: string;
  time: string;
  total_capacity: number;
  booked_count: number;
}

export interface BookingData {
  experience: Experience;
  slot: ExperienceSlot;
  quantity: number;
  subtotal: number;
  taxes: number;
  total: number;
}

interface DetailsPageProps {
  experience: Experience;
  onBack: () => void;
  onCheckout: (bookingData: BookingData) => void;
}

// ✅ Utility for date formatting
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options);
};

// ✅ Static fallback data
const staticSlotsData = {
  "2025-10-22": [
    { _id: "1", time: "07:00 AM", total_capacity: 6, booked_count: 2 },
    { _id: "2", time: "09:00 AM", total_capacity: 3, booked_count: 1 },
    { _id: "3", time: "11:00 AM", total_capacity: 5, booked_count: 0 },
    { _id: "4", time: "01:00 PM", total_capacity: 0, booked_count: 0 }, // sold out
  ],
  "2025-10-23": [
    { _id: "5", time: "08:00 AM", total_capacity: 4, booked_count: 4 }, // sold out
    { _id: "6", time: "10:00 AM", total_capacity: 5, booked_count: 3 },
  ],
  "2025-10-24": [
    { _id: "7", time: "07:00 AM", total_capacity: 10, booked_count: 2 },
    { _id: "8", time: "09:00 AM", total_capacity: 8, booked_count: 3 },
  ],
};

export default function DetailsPage({
  experience,
  onBack,
  onCheckout,
}: DetailsPageProps) {
  const [slots, setSlots] = useState<ExperienceSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<ExperienceSlot | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExperiences, setFilteredExperiences] = useState<Experience[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  // ✅ Fetch all experiences for search
  useEffect(() => {
    fetch("http://localhost:5000/api/experiences")
      .then((res) => res.json())
      .then((data) => {
        setExperiences(data);
        setFilteredExperiences(data);
      })
      .catch((err) => console.error("Error fetching experiences:", err));
  }, []);

  // ✅ Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.toLowerCase();
    const filtered = experiences.filter((exp) =>
      exp.title.toLowerCase().includes(query)
    );
    setFilteredExperiences(filtered);
  };

  // ✅ Fetch slots for this experience
  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/experience-slots/${experience._id}`
      );

      if (!response.ok) {
        console.warn("⚠️ Backend slots not found, using static fallback.");
        // ✅ Use static fallback if API fails
        useStaticSlots();
        return;
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const formattedSlots = data.map((slot) => ({
          ...slot,
          date: new Date(slot.date).toISOString().split("T")[0],
        }));
        setSlots(formattedSlots);
      } else {
        console.warn("⚠️ No slots in response, using static fallback.");
        useStaticSlots();
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      useStaticSlots();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Static slot loader
  const useStaticSlots = () => {
    const combinedSlots: ExperienceSlot[] = [];
    Object.entries(staticSlotsData).forEach(([date, slotsArray]) => {
      slotsArray.forEach((slot) => {
        combinedSlots.push({
          _id: slot._id,
          experience_id: experience._id,
          date,
          time: slot.time,
          total_capacity: slot.total_capacity,
          booked_count: slot.booked_count,
        });
      });
    });
    setSlots(combinedSlots);
  };

  // ✅ Load slots when experience changes
  useEffect(() => {
    if (experience?._id) {
      fetchSlots();
    }
  }, [experience]);

  // ✅ Extract unique dates
  const uniqueDates = Array.from(new Set(slots.map((s) => s.date))).sort();

  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [slots]);

  const getAvailableSlots = () =>
    slots.filter((s) => s.date === selectedDate);

  const isSlotAvailable = (s: ExperienceSlot) =>
    s.booked_count < s.total_capacity;

  const getRemainingCapacity = (s: ExperienceSlot) =>
    s.total_capacity - s.booked_count;

  const calculatePricing = () => {
    const subtotal = experience.price * quantity;
    const taxes = Math.round(subtotal * 0.05);
    const total = subtotal + taxes;
    return { subtotal, taxes, total };
  };

  const handleConfirm = () => {
    if (!selectedSlot) return;
    const { subtotal, taxes, total } = calculatePricing();
    onCheckout({
      experience,
      slot: selectedSlot,
      quantity,
      subtotal,
      taxes,
      total,
    });
  };

  const { subtotal, taxes, total } = calculatePricing();

  // ✅ JSX Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">hd</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-base font-semibold">highway</span>
                <span className="text-base font-semibold">delite</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-xl flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder="Search experiences"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Search size={18} />
              Search
            </button>
          </form>
        </div>
      </header>

      {/* MAIN SECTION */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2">
            <img
              src={experience.image_url}
              alt={experience.title}
              className="w-full h-96 object-cover rounded-2xl shadow-sm"
            />

            <div className="mt-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {experience.title}
              </h1>
              <p className="text-gray-600 mb-6">{experience.description}</p>

              {/* DATE PICKER */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Choose date</h2>
                {loading ? (
                  <div className="flex gap-3">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-20 h-12 bg-gray-200 rounded-lg animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {uniqueDates.map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedDate(d);
                          setSelectedSlot(null);
                        }}
                        className={`px-6 py-3 rounded-lg border-2 whitespace-nowrap transition-colors ${
                          selectedDate === d
                            ? "bg-yellow-400 border-yellow-400 text-black font-medium"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {formatDate(d)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TIME SLOTS */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Choose time</h2>
                {loading ? (
                  <div className="flex gap-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="w-32 h-16 bg-gray-200 rounded-lg animate-pulse"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {getAvailableSlots().map((slot) => {
                      const available = isSlotAvailable(slot);
                      const remaining = getRemainingCapacity(slot);
                      return (
                        <button
                          key={slot._id}
                          onClick={() => available && setSelectedSlot(slot)}
                          disabled={!available}
                          className={`px-4 py-3 rounded-lg border-2 min-w-[140px] transition-colors ${
                            selectedSlot?._id === slot._id
                              ? "bg-yellow-400 border-yellow-400 text-black"
                              : available
                              ? "bg-white border-gray-200 text-gray-900 hover:border-gray-300"
                              : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          <div className="font-medium">{slot.time}</div>
                          {available ? (
                            <div className="text-xs mt-1 text-red-500">
                              {remaining} left
                            </div>
                          ) : (
                            <div className="text-xs mt-1">Sold out</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-3">
                  All times are in IST (GMT +5:30)
                </p>
              </div>

              {/* ABOUT SECTION */}
              <div className="bg-gray-100 rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-gray-600">{experience.about}</p>
              </div>
            </div>
          </div>

          {/* RIGHT (Booking Summary) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-600">Starts at</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₹{experience.price}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 font-medium">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="text-lg font-medium w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* PRICING */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900 font-medium">₹{subtotal}</span>
                </div>
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
                onClick={handleConfirm}
                disabled={!selectedSlot}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  selectedSlot
                    ? "bg-yellow-400 hover:bg-yellow-500 text-black"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
