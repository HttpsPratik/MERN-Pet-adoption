const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validate = require("../middleware/validate");

const { createReportSchema, updateReportStatusSchema } = require("../validators/report.schema");
const { createReport, getReports, updateReport, setListingHidden } = require("../controllers/reports.controller");

// user: report a listing
router.post("/listings/:id/report", auth, validate(createReportSchema), createReport);

// admin: view reports
router.get("/admin/reports", auth, admin, getReports);

// admin: update report status
router.patch("/admin/reports/:reportId", auth, admin, validate(updateReportStatusSchema), updateReport);

// admin: hide/unhide listing
router.patch("/admin/listings/:id/hide", auth, admin, setListingHidden);

module.exports = router;
