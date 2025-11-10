import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getBookings, createBooking, deleteBooking } from "./routes/bookings";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      supabaseUrl: process.env.SUPABASE_URL ? "set" : "not set",
      supabaseKey: process.env.SUPABASE_ANON_KEY ? "set" : "not set",
      env: process.env.NODE_ENV || "development",
    });
  });

  // Example API routes - both with and without /api prefix for Netlify compatibility
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/demo", handleDemo);

  // Booking routes - both with and without /api prefix for Netlify compatibility
  app.get("/api/bookings", getBookings);
  app.get("/bookings", getBookings);

  app.post("/api/bookings", createBooking);
  app.post("/bookings", createBooking);

  app.delete("/api/bookings/:id", deleteBooking);
  app.delete("/bookings/:id", deleteBooking);

  return app;
}
