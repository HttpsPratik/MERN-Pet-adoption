const AuditLog = require("../models/AuditLog");

async function logAction({ actor, action, targetType, targetId, meta = {} }) {
  try {
    await AuditLog.create({
      actor,
      action,
      targetType,
      targetId,
      meta,
    });
  } catch (err) {
    console.error("AUDIT LOG ERROR:", err);
  }
}

module.exports = { logAction };
