const mongoose = require("mongoose");
const Inquiry = require("../models/Inquiry");
const PetListing = require("../models/PetListing");

exports.createInquiry = async (req, res) => {
  try {
    const { id } = req.params; 
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: "Invalid listing id" });

    const listing = await PetListing.findById(id);
    if (!listing || listing.isHidden) return res.status(404).json({ message: "Listing not found" });

    // Prevent contacting your own listing
    if (String(listing.owner) === req.user.id) {
      return res.status(400).json({ message: "You cannot contact your own listing" });
    }

    const inquiry = await Inquiry.create({
      listing: listing._id,
      owner: listing.owner,
      sender: req.user.id,
      message: req.body.message,
      phone: req.body.phone || "",
    });

    return res.status(201).json({ message: "Inquiry sent", inquiryId: inquiry._id });
  } catch (err) {
    console.error("CREATE INQUIRY ERROR:", err);
    return res.status(500).json({ message: "Failed to send inquiry" });
  }
};

exports.getMyInquiriesAsOwner = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { owner: req.user.id };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("sender", "name email")
        .populate("listing", "title species type location"),
      Inquiry.countDocuments(filter),
    ]);

    return res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("GET OWNER INQUIRIES ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch inquiries" });
  }
};


// OWNER: update inquiry status (only listing owner)
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { inquiryId } = req.params;
    if (!mongoose.isValidObjectId(inquiryId)) {
      return res.status(400).json({ message: "Invalid inquiry id" });
    }

    const inquiry = await Inquiry.findById(inquiryId);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    // ✅ owner check
    if (String(inquiry.owner) !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    inquiry.status = req.body.status;
    inquiry.ownerNote = req.body.ownerNote ?? inquiry.ownerNote;

    await inquiry.save();
    return res.json({ message: "Inquiry updated", status: inquiry.status });
  } catch (err) {
    console.error("UPDATE INQUIRY STATUS ERROR:", err);
    return res.status(500).json({ message: "Failed to update inquiry" });
  }
};

// ADMIN: view all inquiries (filters + pagination)
exports.adminGetInquiries = async (req, res) => {
  try {
    const { status, q, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;

    // basic search (message / phone)
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ message: rx }, { phone: rx }];
    }

    const [items, total] = await Promise.all([
      Inquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("sender", "name email")
        .populate("owner", "name email")
        .populate("listing", "title species type location isHidden"),
      Inquiry.countDocuments(filter),
    ]);

    return res.json({
      items,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    console.error("ADMIN GET INQUIRIES ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch inquiries" });
  }
};
