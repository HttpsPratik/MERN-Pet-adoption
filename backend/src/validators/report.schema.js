const { z } = require("zod");

const createReportSchema = z.object({
  reason: z.enum(["spam", "scam", "inappropriate", "duplicate", "wrong_info", "other"]),
  message: z.string().max(500).optional().default(""),
});

const updateReportStatusSchema = z.object({
  status: z.enum(["open", "reviewing", "resolved"]),
  adminNote: z.string().max(500).optional().default(""),
});

module.exports = { createReportSchema, updateReportStatusSchema };
