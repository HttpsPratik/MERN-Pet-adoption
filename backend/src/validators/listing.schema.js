const { z } = require("zod");

const createListingSchema = z.object({
  type: z.enum(["adoption", "missing"]).optional(),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  species: z.enum(["dog", "cat", "other"]),
  breed: z.string().max(50).optional().default(""),
  age: z.number().int().min(0).max(40).optional(),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  location: z.string().min(2).max(80),
  status: z.enum(["active", "adopted", "resolved"]).optional(),
});

const updateListingSchema = createListingSchema.partial();

module.exports = { createListingSchema, updateListingSchema };
