const mongoose = require("mongoose");
const PetListing = require("../models/PetListing");

exports.createListing = async (req, res) => {
  try {
    const listing = await PetListing.create({
      ...req.body,
      owner: req.user.id,
    });
    return res.status(201).json(listing);
  } catch (err) {
    console.error("CREATE LISTING ERROR:", err);
    return res.status(500).json({ message: "Failed to create listing" });
  }
};

exports.getListings = async (req, res) => {
  try {
    const { type, species, status, location, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (species) filter.species = species;
    if (status) filter.status = status;
    if (location) filter.location = new RegExp(location, "i");

    const skip = (Number(page) - 1) * Number(limit);

    const items = await PetListing.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("owner", "name email");

    const total = await PetListing.countDocuments(filter);

    return res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error("GET LISTINGS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch listings" });
  }
};



exports.getListingById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await PetListing.findById(id).populate("owner", "name email");
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    return res.json(listing);
  } catch (err) {
    console.error("GET LISTING ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch listing" });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await PetListing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    
    if (String(listing.owner) !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    
    const allowed = [
      "type",
      "title",
      "description",
      "species",
      "breed",
      "age",
      "gender",
      "location",
      "status",
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) listing[key] = req.body[key];
    }

    await listing.save();
    return res.json({ message: "Updated", listing });
  } catch (err) {
    console.error("UPDATE LISTING ERROR:", err);
    return res.status(500).json({ message: "Failed to update listing" });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await PetListing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    
    if (String(listing.owner) !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await listing.deleteOne();
    return res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE LISTING ERROR:", err);
    return res.status(500).json({ message: "Failed to delete listing" });
  }
};

exports.getMyListings = async (req, res) => {
  try {
    const items = await PetListing.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.json({ items });
  } catch (err) {
    console.error("MY LISTINGS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch my listings" });
  }
};
