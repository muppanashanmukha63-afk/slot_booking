const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  image_url: { type: String },
  created_at: { type: Date, default: Date.now },
});

const Experience = mongoose.model("Experience", experienceSchema);

module.exports = Experience;

