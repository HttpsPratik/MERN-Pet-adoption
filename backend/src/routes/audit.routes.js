const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

const { getAuditLogs } = require("../controllers/audit.controller");

router.get("/admin/audit-logs", auth, admin, getAuditLogs);

module.exports = router;
