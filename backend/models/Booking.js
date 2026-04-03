const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  experienceId: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  quantity: { type: Number, required: true },
  subtotal: { type: Number, required: true },
  taxes: { type: Number, required: true },
  total: { type: Number, required: true },
  promoCode: { type: String },
  discountAmount: { type: Number, default: 0 },
  reference_id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Booking", bookingSchema);
