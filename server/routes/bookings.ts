import { RequestHandler } from "express";
import { Booking, GetBookingsResponse, CreateBookingRequest, CreateBookingResponse } from "@shared/api";
import fs from "fs/promises";
import path from "path";

// Get the data directory - handle both dev and Netlify deployment
function getDataPath() {
  // Try multiple possible locations for the data directory
  const possiblePaths = [
    path.join(process.cwd(), "data"),
    path.join(process.cwd(), "dist", "spa", "data"),
    "/tmp/bookathing-data", // Fallback to temp for Netlify
  ];

  return possiblePaths[0]; // Use the first path (current working directory)
}

const DATA_DIR = getDataPath();
const BOOKINGS_FILE = path.join(DATA_DIR, "bookings.json");

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating data directory:", error);
  }
}

// Load bookings from file
async function loadBookings(): Promise<Booking[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(BOOKINGS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save bookings to file
async function saveBookings(bookings: Booking[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
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
