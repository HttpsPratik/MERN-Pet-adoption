const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "PetListing", required: true },

    reason: {
      type: String,
      enum: ["spam", "scam", "inappropriate", "duplicate", "wrong_info", "other"],
      required: true,
    },

    message: { type: String, default: "", maxlength: 500 },

    status: { type: String, enum: ["open", "reviewing", "resolved"], default: "open" },

    adminNote: { type: String, default: "", maxlength: 500 },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ listing: 1, status: 1 });

module.exports = mongoose.model("Report", reportSchema);
