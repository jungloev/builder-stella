import { RequestHandler } from "express";
import { Booking, GetBookingsResponse, CreateBookingRequest, CreateBookingResponse } from "@shared/api";
import fs from "fs/promises";
import path from "path";
import os from "os";

// In-memory storage as fallback for Netlify where file system is unreliable
const inMemoryBookings: Map<string, Booking[]> = new Map();

// Get the data directory - handle both dev and Netlify deployment
function getDataPath() {
  // On Netlify, use /tmp for persistent storage within a deployment
  // In development, use the local data directory
  if (process.env.NETLIFY || process.env.NETLIFY_FUNCTIONS_RUNTIME) {
    return path.join(os.tmpdir(), "bookathing-data");
  }
  // In development, use the local data directory
  return path.join(process.cwd(), "data");
}

const DATA_DIR = getDataPath();
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");
const USE_FILE_STORAGE = !process.env.NETLIFY && !process.env.NETLIFY_FUNCTIONS_RUNTIME;

// Ensure data directory exists
async function ensureDataDir() {
  if (!USE_FILE_STORAGE) return;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Load bookings from file or in-memory storage
async function loadBookings(): Promise<Booking[]> {
  // Use in-memory storage on Netlify
  if (!USE_FILE_STORAGE) {
    return inMemoryBookings.get("all") || [];
  }

  try {
    await ensureDataDir();
    try {
      const data = await fs.readFile(BOOKINGS_FILE, "utf-8");
      return JSON.parse(data);
    } catch (readError) {
      // If file doesn't exist, return empty array and initialize it
      if ((readError as any).code === "ENOENT") {
        await saveBookings([]);
        return [];
      }
      throw readError;
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    return [];
  }
}

// Save bookings to file or in-memory storage
async function saveBookings(bookings: Booking[]): Promise<void> {
  // Use in-memory storage on Netlify
  if (!USE_FILE_STORAGE) {
    inMemoryBookings.set("all", bookings);
    return;
  }

  try {
    await ensureDataDir();
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
  } catch (error) {
    console.error("Error saving bookings:", error);
  }
}

// GET /api/bookings?date=YYYY-MM-DD
export const getBookings: RequestHandler = async (req, res) => {
  try {
    const date = req.query.date as string;
    const allBookings = await loadBookings();

    const bookings = date
      ? allBookings.filter(b => b.date === date)
      : allBookings;

    const response: GetBookingsResponse = { bookings };
    res.json(response);
  } catch (error) {
    console.error("Error getting bookings:", error);
    console.error("Data directory:", DATA_DIR);
    console.error("Bookings file:", BOOKINGS_FILE);
    res.status(500).json({ error: "Failed to get bookings" });
  }
};

// POST /api/bookings
export const createBooking: RequestHandler = async (req, res) => {
  try {
    const { name, startTime, endTime, date } = req.body as CreateBookingRequest;

    if (!name || !startTime || !endTime || !date) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const bookings = await loadBookings();

    const newBooking: Booking = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      startTime,
      endTime,
      date,
    };

    bookings.push(newBooking);
    await saveBookings(bookings);

    const response: CreateBookingResponse = { booking: newBooking };
    res.json(response);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
};

// DELETE /api/bookings/:id
export const deleteBooking: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: "Missing booking id" });
      return;
    }

    const bookings = await loadBookings();
    const filteredBookings = bookings.filter(b => b.id !== id);

    if (filteredBookings.length === bookings.length) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    await saveBookings(filteredBookings);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};
