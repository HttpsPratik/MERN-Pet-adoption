const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { createListing, getListings } = require("../controllers/listings.controller");

router.get("/", getListings);            // public
router.post("/", auth, createListing);   // protected

module.exports = router;
