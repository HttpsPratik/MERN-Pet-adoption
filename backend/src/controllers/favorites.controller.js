const mongoose = require("mongoose");
const User = require("../models/User");
const PetListing = require("../models/PetListing");

exports.toggleFavorite = async (req, res) => {
  try {
    const { id } = req.params; // listing id
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await PetListing.findById(id);
    if (!listing || listing.isHidden) {
      return res.status(404).json({ message: "Listing not found" });
    }

    const user = await User.findById(req.user.id);
    const exists = user.favorites.some((x) => String(x) === String(id));

    if (exists) {
      user.favorites = user.favorites.filter((x) => String(x) !== String(id));
      await user.save();
      return res.json({ message: "Removed from favorites" });
    } else {
      user.favorites.push(id);
      await user.save();
      return res.json({ message: "Added to favorites" });
    }
  } catch (err) {
    console.error("TOGGLE FAVORITE ERROR:", err);
    return res.status(500).json({ message: "Failed to update favorites" });
  }
};

exports.getMyFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "favorites",
      match: { isHidden: false },
      options: { sort: { createdAt: -1 } },
      populate: { path: "owner", select: "name email" },
    });

    return res.json({ items: user.favorites || [] });
  } catch (err) {
    console.error("GET FAVORITES ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch favorites" });
  }
};
