// models/ExperienceSlot.js
const mongoose = require("mongoose");

const experienceSlotSchema = new mongoose.Schema(
  {
    experience_id: {
      type: Number, // ✅ store numeric ID, not ObjectId
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    total_capacity: {
      type: Number,
      default: 10,
      min: 1,
    },
    booked_count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const ExperienceSlot = mongoose.model("ExperienceSlot", experienceSlotSchema);
module.exports = ExperienceSlot;
