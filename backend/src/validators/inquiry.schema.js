const { z } = require("zod");

const createInquirySchema = z.object({
  message: z.string().min(5).max(1000),
  phone: z.string().max(30).optional().default(""),
});

const updateInquiryStatusSchema = z.object({
  status: z.enum(["open", "replied", "closed"]),
  ownerNote: z.string().max(500).optional().default(""),
});

module.exports = { createInquirySchema, updateInquiryStatusSchema };
