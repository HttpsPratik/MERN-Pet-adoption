const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const { toggleFavorite, getMyFavorites } = require("../controllers/favorites.controller");

router.post("/listings/:id/favorite", auth, toggleFavorite);
router.get("/me/favorites", auth, getMyFavorites);

module.exports = router;
