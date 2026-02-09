const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const admin = require("../middleware/admin");
const { createInquirySchema, updateInquiryStatusSchema } = require("../validators/inquiry.schema");
const {
  createInquiry,
  getMyInquiriesAsOwner,
  updateInquiryStatus,
  adminGetInquiries,
} = require("../controllers/inquiry.controller");

router.post("/listings/:id/inquire", auth, validate(createInquirySchema), createInquiry);
router.get("/me/inquiries", auth, getMyInquiriesAsOwner);


// user → send inquiry
router.post("/listings/:id/inquire", auth, validate(createInquirySchema), createInquiry);

// owner → view inquiries on my listings
router.get("/me/inquiries", auth, getMyInquiriesAsOwner);

// owner → update inquiry status
router.patch("/inquiries/:inquiryId/status", auth, validate(updateInquiryStatusSchema), updateInquiryStatus);

// admin → view all inquiries
router.get("/admin/inquiries", auth, admin, adminGetInquiries);

module.exports = router;
