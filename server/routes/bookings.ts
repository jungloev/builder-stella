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

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (initError) {
      console.error("Supabase initialization error:", initError);
      if (!res.headersSent) {
        res.status(503).json({
          error: "Database service unavailable. Please configure Supabase environment variables.",
          details: initError instanceof Error ? initError.message : String(initError)
        });
      }
      return;
    }

    try {
      let query = supabase.from("bookings").select("*");

      if (date) {
        query = query.eq("date", date);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching bookings:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to get bookings" });
        }
        return;
      }

      const bookings = (data || []).map(mapRowToBooking);
      const response: GetBookingsResponse = { bookings };
      if (!res.headersSent) {
        res.json(response);
      }
    } catch (queryError) {
      console.error("Query execution error:", queryError);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to query bookings" });
      }
    }
  } catch (error) {
    console.error("Unexpected error in getBookings:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

// POST /api/bookings
export const createBooking: RequestHandler = async (req, res) => {
  try {
    const { name, startTime, endTime, date } = req.body as CreateBookingRequest;

    if (!name || !startTime || !endTime || !date) {
      if (!res.headersSent) {
        res.status(400).json({ error: "Missing required fields" });
      }
      return;
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (initError) {
      console.error("Supabase initialization error:", initError);
      if (!res.headersSent) {
        res.status(503).json({
          error: "Database service unavailable. Please configure Supabase environment variables.",
          details: initError instanceof Error ? initError.message : String(initError)
        });
      }
      return;
    }

    try {
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
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to create booking", details: error.message });
        }
        return;
      }

      const booking = mapRowToBooking(data);
      const response: CreateBookingResponse = { booking };
      if (!res.headersSent) {
        res.json(response);
      }
    } catch (queryError) {
      console.error("Query execution error:", queryError);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create booking" });
      }
    }
  } catch (error) {
    console.error("Unexpected error in createBooking:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
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

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (initError) {
      console.error("[DELETE /api/bookings/:id] Supabase initialization error:", initError);
      if (!res.headersSent) {
        res.status(503).json({
          error: "Database service unavailable. Please configure Supabase environment variables.",
          details: initError instanceof Error ? initError.message : String(initError)
        });
      }
      return;
    }

    try {
      console.log(`[DELETE /api/bookings/:id] Executing delete query for id: ${id}`);
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[DELETE /api/bookings/:id] Supabase error:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to delete booking", details: error.message });
        }
        return;
      }

      console.log(`[DELETE /api/bookings/:id] Successfully deleted booking with id: ${id}`);
      if (!res.headersSent) {
        res.json({ success: true });
      }
    } catch (queryError) {
      console.error("[DELETE /api/bookings/:id] Query execution error:", queryError);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to delete booking", details: queryError instanceof Error ? queryError.message : String(queryError) });
      }
    }
  } catch (error) {
    console.error("[DELETE /api/bookings/:id] Unexpected error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) });
    }
  }
};
