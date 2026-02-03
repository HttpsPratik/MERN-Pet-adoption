const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth.routes");
const listingsRoutes = require("./routes/listings.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.json({ message: "Pet Adoption API is running" }));
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
module.exports = app;


app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
