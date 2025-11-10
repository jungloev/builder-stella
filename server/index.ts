import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getBookings, createBooking, deleteBooking } from "./routes/bookings";

export function createServer() {
  const app = express();

  // Middleware - order matters!
  // CORS first
  app.use(cors());

  // Body parsing with explicit handling
  app.use(express.json({ limit: "10mb" }));
  app.use(express.text({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Request logging middleware - AFTER body parsing
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log("  Content-Type:", req.get("content-type"));
    console.log("  Raw body type:", typeof (req as any).rawBody);
    console.log("  Parsed body type:", typeof req.body);
    if (req.body && typeof req.body === "object") {
      console.log("  Body keys:", Object.keys(req.body));
      console.log("  Body:", JSON.stringify(req.body));
    }
    next();
  });

  // Debug endpoint to check body parsing
  app.post("/api/debug-body", (_req, res) => {
    res.json({
      receivedBody: _req.body,
      bodyType: typeof _req.body,
      bodyKeys: Object.keys(_req.body || {}),
      contentType: _req.get("content-type"),
    });
  });

  // Health check endpoint - both with and without /api prefix
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      supabaseUrl: process.env.SUPABASE_URL ? "set" : "not set",
      supabaseKey: process.env.SUPABASE_ANON_KEY ? "set" : "not set",
      env: process.env.NODE_ENV || "development",
    });
  });
  app.get("/api/health", (_req, res) => {
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
