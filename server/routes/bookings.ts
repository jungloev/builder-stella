import { RequestHandler } from "express";
import { Booking, GetBookingsResponse, CreateBookingRequest, CreateBookingResponse } from "@shared/api";
import { createClient } from "@supabase/supabase-js";

// Lazy initialize Supabase client - only when needed
let supabaseClient: ReturnType<typeof createClient> | null = null;
let initializationError: Error | null = null;

function getSupabaseClient() {
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
    throw error;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error(String(error));
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

    try {
      const supabase = getSupabaseClient();

      let query = supabase.from("bookings").select("*");

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ error: "Failed to get bookings" });
        return;
      }

      const bookings = (data || []).map(mapRowToBooking);
      const response: GetBookingsResponse = { bookings };
      res.json(response);
    } catch (supabaseError) {
      console.error("Supabase initialization error:", supabaseError);
      res.status(503).json({ error: "Database service unavailable. Please configure Supabase environment variables." });
    }
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

    try {
      const supabase = getSupabaseClient();
      const bookingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
        console.error("Error creating booking:", error);
        res.status(500).json({ error: "Failed to create booking" });
        return;
      }

      const booking = mapRowToBooking(data);
      const response: CreateBookingResponse = { booking };
      res.json(response);
    } catch (supabaseError) {
      console.error("Supabase initialization error:", supabaseError);
      res.status(503).json({ error: "Database service unavailable. Please configure Supabase environment variables." });
    }
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

    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({ error: "Failed to delete booking" });
        return;
      }

      res.json({ success: true });
    } catch (supabaseError) {
      console.error("Supabase initialization error:", supabaseError);
      res.status(503).json({ error: "Database service unavailable. Please configure Supabase environment variables." });
    }
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};
