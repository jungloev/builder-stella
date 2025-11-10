import express from "express";
import serverless from "serverless-http";

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// In-memory storage for bookings
interface Booking {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  date: string;
}

const bookings: Booking[] = [];

console.log("[API] Initializing Netlify API function");

// GET /api/bookings or /bookings
app.get(["/bookings", "/api/bookings"], (req, res) => {
  const date = req.query.date as string | undefined;
  const filtered = date
    ? bookings.filter(b => b.date === date)
    : bookings;
  
  console.log(`[GET /bookings] date=${date}, found ${filtered.length} bookings`);
  res.json({ bookings: filtered });
});

// POST /api/bookings or /bookings
app.post(["/bookings", "/api/bookings"], (req, res) => {
  const { name, startTime, endTime, date } = req.body;

  console.log("[POST /bookings] Received:", { name, startTime, endTime, date });

  if (!name || !startTime || !endTime || !date) {
    return res.status(400).json({
      error: "Missing required fields",
      received: { name, startTime, endTime, date }
    });
  }

  const booking: Booking = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    startTime,
    endTime,
    date,
  };

  bookings.push(booking);
  console.log("[POST /bookings] Created booking:", booking.id);
  console.log("[POST /bookings] Total bookings in memory:", bookings.length);

  res.json({ booking });
});

// DELETE /api/bookings/:id or /bookings/:id
app.delete(["/bookings/:id", "/api/bookings/:id"], (req, res) => {
  const { id } = req.params;
  const index = bookings.findIndex(b => b.id === id);

  console.log(`[DELETE /bookings/${id}] Looking for booking...`);

  if (index === -1) {
    console.log(`[DELETE /bookings/${id}] Not found`);
    return res.status(404).json({ error: "Booking not found" });
  }

  bookings.splice(index, 1);
  console.log(`[DELETE /bookings/${id}] Deleted. Remaining: ${bookings.length}`);
  res.json({ success: true });
});

// Health check
app.get(["/health", "/api/health"], (_req, res) => {
  res.json({
    status: "ok",
    supabaseUrl: process.env.SUPABASE_URL ? "set" : "not set",
    supabaseKey: process.env.SUPABASE_ANON_KEY ? "set" : "not set",
    bookingsInMemory: bookings.length,
  });
});

// Catch-all 404
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Export handler
export const handler = serverless(app);
