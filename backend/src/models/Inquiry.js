const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "PetListing", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    message: { type: String, required: true, minlength: 5, maxlength: 1000 },
    phone: { type: String, default: "", maxlength: 30 },

    status: { type: String, enum: ["open", "replied", "closed"], default: "open" },
    ownerNote: { type: String, default: "", maxlength: 500 },

    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: "", maxlength: 200 },
  },
  { timestamps: true }
);

inquirySchema.index({ owner: 1, createdAt: -1 });
inquirySchema.index({ listing: 1, createdAt: -1 });
inquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Inquiry", inquirySchema);
