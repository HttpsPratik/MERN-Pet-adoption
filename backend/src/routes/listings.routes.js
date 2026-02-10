const express = require("express");
const router = express.Router();
const upload = require("../utils/uploadMemory");
const auth = require("../middleware/auth");
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  addListingImages,
  removeListingImage,
} = require("../controllers/listings.controller");

const validate = require("../middleware/validate");
const {
  createListingSchema,
  updateListingSchema,
} = require("../validators/listing.schema");

router.get("/", getListings); // public list
router.get("/me", auth, getMyListings); // my listings (protected)
router.get("/:id", getListingById); // public detail

router.post("/", auth, createListing); // protected
router.patch("/:id", auth, updateListing); // owner only
router.delete("/:id", auth, deleteListing); // owner only

router.post("/:id/images", auth, upload.array("images", 5), addListingImages); //protected + owner only

// create
router.post("/", auth, validate(createListingSchema), createListing);

// update
router.patch("/:id", auth, validate(updateListingSchema), updateListing);

router.post("/:id/images", auth, upload.array("images", 5), addListingImages);
router.delete("/:id/images/:publicId", auth, removeListingImage);

module.exports = router;
