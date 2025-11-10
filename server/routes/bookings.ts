import { RequestHandler } from "express";
import { Booking, GetBookingsResponse, CreateBookingRequest, CreateBookingResponse } from "@shared/api";
import { createClient } from "@supabase/supabase-js";

// Lazy initialize Supabase client - only when needed
let supabaseClient: ReturnType<typeof createClient> | null = null;
let initializationError: Error | null = null;
let supabaseAvailable = true;

// In-memory fallback storage
const inMemoryBookings: Booking[] = [];

function getSupabaseClient() {
  if (!supabaseAvailable) {
    throw new Error("Supabase is not available, using in-memory storage");
  }

  if (initializationError) {
    throw initializationError;
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const error = new Error(
      `Missing Supabase environment variables. SUPABASE_URL: ${supabaseUrl ? "set" : "missing"}, SUPABASE_ANON_KEY: ${supabaseKey ? "set" : "missing"}`
    );
    initializationError = error;
    supabaseAvailable = false;
    throw error;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error(String(error));
    supabaseAvailable = false;
    throw initializationError;
  }
}

// Convert Supabase row to Booking
function mapRowToBooking(row: any): Booking {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    date: row.date,
  };
}

// GET /api/bookings?date=YYYY-MM-DD
export const getBookings: RequestHandler = async (req, res) => {
  try {
    const date = req.query.date as string;

    let bookings: Booking[];

    // Try Supabase first
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from("bookings").select("*");

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[GET /api/bookings] Supabase error:", error);
        throw error;
      }

      bookings = (data || []).map(mapRowToBooking);
    } catch (supabaseError) {
      // Fallback to in-memory storage
      console.log("[GET /api/bookings] Using in-memory fallback storage");
      bookings = date
        ? inMemoryBookings.filter(b => b.date === date)
        : inMemoryBookings;
    }

    const response: GetBookingsResponse = { bookings };
    if (!res.headersSent) {
      res.json(response);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[GET /api/bookings] Error:", errorMsg);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get bookings", details: errorMsg });
    }
  }
};

// POST /api/bookings
export const createBooking: RequestHandler = async (req, res) => {
  try {
    console.log("[POST /api/bookings] Received request body:", req.body);
    const { name, startTime, endTime, date } = req.body as CreateBookingRequest;

    console.log("[POST /api/bookings] Parsed fields:", { name, startTime, endTime, date });

    if (!name || !startTime || !endTime || !date) {
      console.error("[POST /api/bookings] Missing required fields:", {
        name: name ? "present" : "missing",
        startTime: startTime ? "present" : "missing",
        endTime: endTime ? "present" : "missing",
        date: date ? "present" : "missing"
      });
      if (!res.headersSent) {
        res.status(400).json({ error: "Missing required fields", received: { name, startTime, endTime, date } });
      }
      return;
    }

    const bookingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const booking: Booking = { id: bookingId, name, startTime, endTime, date };

    // Try Supabase first
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          id: bookingId,
          name,
          start_time: startTime,
          end_time: endTime,
          date,
        })
        .select()
        .single();

      if (error) {
        console.error("[POST /api/bookings] Supabase error:", error);
        throw error;
      }

      const response: CreateBookingResponse = { booking: mapRowToBooking(data) };
      if (!res.headersSent) {
        res.json(response);
      }
    } catch (supabaseError) {
      // Fallback to in-memory storage
      console.log("[POST /api/bookings] Using in-memory fallback storage");
      inMemoryBookings.push(booking);

      const response: CreateBookingResponse = { booking };
      if (!res.headersSent) {
        res.json(response);
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[POST /api/bookings] Error:", errorMsg);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create booking", details: errorMsg });
    }
  }
};

// DELETE /api/bookings/:id
export const deleteBooking: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[DELETE /api/bookings/:id] Deleting booking with id: ${id}`);

    if (!id) {
      console.error("[DELETE /api/bookings/:id] Missing booking id");
      if (!res.headersSent) {
        res.status(400).json({ error: "Missing booking id" });
      }
      return;
    }

    // Try Supabase first
    try {
      const supabase = getSupabaseClient();
      console.log(`[DELETE /api/bookings/:id] Executing Supabase delete for id: ${id}`);

      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[DELETE /api/bookings/:id] Supabase error:", error);
        throw error;
      }

      console.log(`[DELETE /api/bookings/:id] Successfully deleted booking with id: ${id}`);
      if (!res.headersSent) {
        res.json({ success: true });
      }
    } catch (supabaseError) {
      // Fallback to in-memory storage
      console.log("[DELETE /api/bookings/:id] Using in-memory fallback storage");
      const initialLength = inMemoryBookings.length;
      const filteredBookings = inMemoryBookings.filter(b => b.id !== id);

      if (filteredBookings.length === initialLength) {
        if (!res.headersSent) {
          res.status(404).json({ error: "Booking not found" });
        }
        return;
      }

      // Update in-memory storage
      inMemoryBookings.length = 0;
      inMemoryBookings.push(...filteredBookings);

      if (!res.headersSent) {
        res.json({ success: true });
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[DELETE /api/bookings/:id] Error:", errorMsg);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to delete booking", details: errorMsg });
    }
  }
};
