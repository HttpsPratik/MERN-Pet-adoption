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
