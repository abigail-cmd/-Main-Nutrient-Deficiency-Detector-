

require("dotenv").config();

const express = require("express");
const path = require("path");
const session = require("express-session");

const mainRoutes = require("./routes/mainRoutes");
const { initializeDatabase } = require("./db/database");
const app = express();
const PORT = 3000;

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Routes

if (!process.env.SESSION_SECRET || !process.env.ADMIN_PASSWORD) {
  console.warn(
    "⚠️  SESSION_SECRET and/or ADMIN_PASSWORD are not set in your .env file — " +
    "using insecure defaults. Copy .env.example to .env and set real values " +
    "before deploying, especially if this repo is or will be public."
  );
}

app.use(
  session({
    secret: process.env.SESSION_SECRET || "insecure-dev-only-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60, // 1 hour
    },
  })
);

app.use("/", mainRoutes);

// Start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
  }
}

startServer();