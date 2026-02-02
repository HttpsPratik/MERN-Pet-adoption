const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
} = require("../controllers/listings.controller");

router.get("/", getListings);                 // public list
router.get("/me", auth, getMyListings);       // my listings (protected)
router.get("/:id", getListingById);           // public detail

router.post("/", auth, createListing);        // protected
router.patch("/:id", auth, updateListing);    // owner only
router.delete("/:id", auth, deleteListing);   // owner only

module.exports = router;
