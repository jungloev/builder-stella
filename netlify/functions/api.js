// Import the built Express server
const express = require("express");
const serverless = require("serverless-http");

// Create a simple Express app with API routes
const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Simple in-memory storage
const bookings = [];

// GET /api/bookings
app.get("/bookings", (req, res) => {
  const date = req.query.date;
  const filtered = date
    ? bookings.filter(b => b.date === date)
    : bookings;
  res.json({ bookings: filtered });
});

app.get("/api/bookings", (req, res) => {
  const date = req.query.date;
  const filtered = date
    ? bookings.filter(b => b.date === date)
    : bookings;
  res.json({ bookings: filtered });
});

// POST /api/bookings
app.post("/bookings", (req, res) => {
  const { name, startTime, endTime, date } = req.body;

  console.log("[POST /bookings] Received:", { name, startTime, endTime, date });

  if (!name || !startTime || !endTime || !date) {
    return res.status(400).json({
      error: "Missing required fields",
      received: { name, startTime, endTime, date }
    });
  }

  const booking = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    startTime,
    endTime,
    date,
  };

  bookings.push(booking);
  console.log("[POST /bookings] Booking created:", booking);
  console.log("[POST /bookings] Total bookings:", bookings.length);

  res.json({ booking });
});

app.post("/api/bookings", (req, res) => {
  const { name, startTime, endTime, date } = req.body;

  console.log("[POST /api/bookings] Received:", { name, startTime, endTime, date });

  if (!name || !startTime || !endTime || !date) {
    return res.status(400).json({
      error: "Missing required fields",
      received: { name, startTime, endTime, date }
    });
  }

  const booking = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    startTime,
    endTime,
    date,
  };

  bookings.push(booking);
  console.log("[POST /api/bookings] Booking created:", booking);
  console.log("[POST /api/bookings] Total bookings:", bookings.length);

  res.json({ booking });
});

// DELETE /api/bookings/:id
app.delete("/bookings/:id", (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }

  bookings.splice(index, 1);
  res.json({ success: true });
});

app.delete("/api/bookings/:id", (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Booking not found" });
  }

  bookings.splice(index, 1);
  res.json({ success: true });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    supabaseUrl: process.env.SUPABASE_URL ? "set" : "not set",
    supabaseKey: process.env.SUPABASE_ANON_KEY ? "set" : "not set",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    supabaseUrl: process.env.SUPABASE_URL ? "set" : "not set",
    supabaseKey: process.env.SUPABASE_ANON_KEY ? "set" : "not set",
  });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Export handler
const handler = serverless(app);
module.exports = { handler };
