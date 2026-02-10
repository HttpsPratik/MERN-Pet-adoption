const mongoose = require("mongoose");
const Report = require("../models/Report");
const PetListing = require("../models/PetListing");

exports.createReport = async (req, res) => {
  try {
    const { id } = req.params; // listing id
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await PetListing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    // prevent duplicate open reports by same user
    const exists = await Report.findOne({
      reporter: req.user.id,
      listing: id,
      status: { $in: ["open", "reviewing"] },
    });

    if (exists) {
      return res.status(409).json({ message: "You already reported this listing" });
    }

    const report = await Report.create({
      reporter: req.user.id,
      listing: id,
      reason: req.body.reason,
      message: req.body.message,
    });

    return res.status(201).json({ message: "Report submitted", reportId: report._id });
  } catch (err) {
    console.error("CREATE REPORT ERROR:", err);
    return res.status(500).json({ message: "Failed to submit report" });
  }
};

// admin: list reports with filters + pagination
exports.getReports = async (req, res) => {
  try {
    const { status = "open", page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("reporter", "name email")
        .populate("listing", "title species type status isHidden location"),
      Report.countDocuments(filter),
    ]);

    return res.json({ items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    console.error("GET REPORTS ERROR:", err);
    return res.status(500).json({ message: "Failed to fetch reports" });
  }
};

// admin: update report status + optional hide listing
exports.updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!mongoose.isValidObjectId(reportId)) {
      return res.status(400).json({ message: "Invalid report id" });
    }

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    if (req.body.status) report.status = req.body.status;
    if (req.body.adminNote !== undefined) report.adminNote = req.body.adminNote ?? report.adminNote;

    if (req.body.status === "resolved") {
      report.resolvedBy = req.user.id;
      report.resolvedAt = new Date();
    }

    await report.save(); // ✅ save first

    await logAction({
      actor: req.user.id,
      action: "REPORT_UPDATED",
      targetType: "Report",
      targetId: report._id,
      meta: { status: report.status },
    });

    return res.json({ message: "Report updated" });
  } catch (err) {
    console.error("UPDATE REPORT ERROR:", err);
    return res.status(500).json({ message: "Failed to update report" });
  }
};


// admin: hide/unhide listing
exports.setListingHidden = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await PetListing.findById(id);
    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    listing.isHidden = Boolean(req.body.isHidden);
    await listing.save(); // ✅ SAVE FIRST

    // ✅ AUDIT LOG (B)
    await logAction({
      actor: req.user.id,
      action: listing.isHidden ? "LISTING_HIDDEN" : "LISTING_UNHIDDEN",
      targetType: "Listing",
      targetId: listing._id,
    });

    return res.json({
      message: "Listing updated",
      isHidden: listing.isHidden,
    });
  } catch (err) {
    console.error("HIDE LISTING ERROR:", err);
    return res.status(500).json({ message: "Failed to update listing" });
  }
};
