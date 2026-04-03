const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Experience = require("./models/Experience");
const ExperienceSlot = require("./models/experienceSlot"); 
const Booking = require("./models/Booking");
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/highway_delite", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => console.log("✅ MongoDB connected successfully!"));

// Routes
app.get("/api/experiences", async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ created_at: -1 });
    res.json(experiences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/experience-slots", async (req, res) => {
  try {
    const { experience_id, date, time, total_capacity } = req.body;

    if (!experience_id || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newSlot = new ExperienceSlot({
      experience_id,
      date,
      time,
      total_capacity,
      booked_count: 0,
    });

    const savedSlot = await newSlot.save();
    res.status(201).json(savedSlot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get slots for a specific experience
// server.js or routes.js
app.get("/api/experience-slots/:experienceId", async (req, res) => {
  try {
    const { experienceId } = req.params;

    // Find the experience by its MongoDB _id
    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    // Use the numeric id field to fetch slots
    const slots = await ExperienceSlot.find({ experience_id: experience.id });

    if (!slots || slots.length === 0) {
      return res.status(404).json({ message: "No slots found for this experience" });
    }

    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/create-booking", async (req, res) => {
  try {
    const {
      experienceId,
      fullName,
      email,
      quantity,
      subtotal,
      taxes,
      total,
      promoCode,
      discountAmount,
    } = req.body;

    const reference_id = `BOOK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const booking = new Booking({
      experienceId,
      fullName,
      email,
      quantity,
      subtotal,
      taxes,
      total,
      promoCode,
      discountAmount,
      reference_id,
    });

    await booking.save();

    res.status(201).json({ success: true, booking });
  } catch (err) {
    console.error("Booking creation error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


// ✅ Validate Promo Code API
app.post("/api/validate-promo", (req, res) => {
  const { code } = req.body;
  const promoCodes = {
    SAVE10: 10,
    HOLIDAY20: 20,
    WELCOME5: 5,
  };

  if (promoCodes[code?.toUpperCase()]) {
    res.json({
      valid: true,
      discount_percentage: promoCodes[code.toUpperCase()],
    });
  } else {
    res.json({ valid: false });
  }
});

// ✅ Default test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ✅ Start server
app.listen(5000, () => console.log("✅ Server running on port 5000"));
