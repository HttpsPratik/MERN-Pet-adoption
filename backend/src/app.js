const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const compression = require("compression");
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



// Optional hardening
// const mongoSanitize = require("express-mongo-sanitize");
// const xss = require("xss-clean");

const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const listingsRoutes = require("./routes/listings.routes");


app.use(helmet());
app.use(compression());

// If you have a frontend domain, lock CORS later:
// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(cors());

app.use(express.json({ limit: "1mb" }));

// Optional hardening
// app.use(mongoSanitize());
// app.use(xss());

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Rate limit auth endpoints (protect from brute force)
app.use(
  "/api/auth",
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    message: { message: "Too many attempts, try again later." },
  })
);

// static uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => res.json({ message: "Pet Adoption API running" }));
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// global error handler (must be last)
app.use(errorHandler);

module.exports = app;
