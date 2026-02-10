const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who did it
    action: { type: String, required: true }, // e.g. "INQUIRY_STATUS_UPDATED"
    targetType: { type: String, required: true }, // "Inquiry", "Listing", "Report", "User"
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },

    meta: { type: Object, default: {} }, // extra info (status, reason, etc.)
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
