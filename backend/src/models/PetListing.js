const mongoose = require("mongoose");

const petListingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: { type: String, enum: ["adoption", "missing"], default: "adoption" },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },

    species: { type: String, enum: ["dog", "cat", "other"], required: true },
    breed: { type: String, default: "" },

    age: { type: Number, min: 0 },
    gender: { type: String, enum: ["male", "female", "unknown"], default: "unknown" },

    location: { type: String, required: true, trim: true },

    status: { type: String, enum: ["active", "adopted", "resolved"], default: "active" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PetListing", petListingSchema);
