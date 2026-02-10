const mongoose = require("mongoose");
const PetListing = require("../models/PetListing");
const cloudinary = require("../config/cloudinary");
const { uploadBuffer } = require("../utils/cloudinaryUpload");


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
    const {
      type,
      species,
      status,
      location,
      gender,
      minAge,
      maxAge,
      q,
      page = 1,
      limit = 10,
      sort = "new", // new | old | ageAsc | ageDesc
    } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (species) filter.species = species;
    if (status) filter.status = status;
    if (gender) filter.gender = gender;

    // location partial match
    if (location) filter.location = new RegExp(String(location), "i");

    // age range
    if (minAge || maxAge) {
      filter.age = {};
      if (minAge) filter.age.$gte = Number(minAge);
      if (maxAge) filter.age.$lte = Number(maxAge);
    }

    // text search
    let sortObj = { createdAt: -1 };
    if (sort === "old") sortObj = { createdAt: 1 };
    if (sort === "ageAsc") sortObj = { age: 1, createdAt: -1 };
    if (sort === "ageDesc") sortObj = { age: -1, createdAt: -1 };

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    let query = PetListing.find(filter);

    if (q && String(q).trim().length > 0) {
      query = PetListing.find(
        { ...filter, $text: { $search: String(q).trim() } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" }, ...sortObj });
    } else {
      query = query.sort(sortObj);
    }

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limitNum).populate("owner", "name email"),
      PetListing.countDocuments(q ? { ...filter, $text: { $search: String(q).trim() } } : filter),
    ]);

    return res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("GET LISTINGS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch listings" });
  }
  filter.isHidden = false;

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

    const images = listing.images || [];

    // ✅ safer cleanup
    await Promise.allSettled(
      images
        .filter((img) => img && img.publicId)
        .map((img) => cloudinary.uploader.destroy(img.publicId))
    );

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

exports.addListingImages = async (req, res) => {
  try {
    const listing = await PetListing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    // owner check
    if (String(listing.owner) !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ message: "No images uploaded" });

    const folder = `${process.env.CLOUDINARY_FOLDER || "adoptme"}/listings/${listing._id}`;

    const uploads = await Promise.all(
      files.map((f) =>
        uploadBuffer(f.buffer, {
          folder,
          resource_type: "image",
        })
      )
    );

    const newImages = uploads.map((u) => ({
      url: u.secure_url,
      publicId: u.public_id,
    }));

    listing.images = [...(listing.images || []), ...newImages];
    await listing.save();

    return res.json({ message: "Images added", images: listing.images });
  } catch (err) {
    console.error("CLOUDINARY UPLOAD ERROR:", err);
    return res.status(500).json({ message: "Failed to upload images" });
  }
};

exports.removeListingImage = async (req, res) => {
  try {
    const { id, publicId } = req.params;

    const listing = await PetListing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    // owner check
    if (String(listing.owner) !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const decodedPublicId = decodeURIComponent(publicId);

    // delete from cloudinary
    await cloudinary.uploader.destroy(decodedPublicId);

    // remove from db
    listing.images = (listing.images || []).filter((img) => img.publicId !== decodedPublicId);
    await listing.save();

    return res.json({ message: "Image removed", images: listing.images });
  } catch (err) {
    console.error("REMOVE IMAGE ERROR:", err);
    return res.status(500).json({ message: "Failed to remove image" });
  }
};
