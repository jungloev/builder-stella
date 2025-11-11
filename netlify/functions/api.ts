import { createClient } from "@supabase/supabase-js";

interface Booking {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  date: string;
}

let supabaseClient: ReturnType<typeof createClient> | null = null;
let supabaseInitError: Error | null = null;
const inMemoryBookings: Booking[] = [];

function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (supabaseInitError) {
    throw supabaseInitError;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const error = new Error(
      `Missing Supabase environment variables. URL: ${supabaseUrl ? "set" : "missing"}, KEY: ${supabaseKey ? "set" : "missing"}`
    );
    supabaseInitError = error;
    throw error;
  }

  try {
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (error) {
    supabaseInitError = error instanceof Error ? error : new Error(String(error));
    throw supabaseInitError;
  }
}

function mapRowToBooking(row: any): Booking {
  return {
    id: row.id,
    name: row.name,
    startTime: row.start_time,
    endTime: row.end_time,
    date: row.date,
  };
}

export const handler = async (event: any) => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    // Parse body
    let body: any = {};
    if (event.body) {
      try {
        body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch (e) {
        console.error("Failed to parse body:", event.body);
      }
    }

    console.log(`[${method}] ${path}`, { bodyKeys: Object.keys(body), bodyLength: JSON.stringify(body).length });

    // GET /api/bookings
    if (method === "GET" && (path === "/api/bookings" || path === "/bookings")) {
      const date = event.queryStringParameters?.date;
      let bookings: Booking[] = [];

      try {
        const supabase = getSupabaseClient();
        let query = supabase.from("bookings").select("*");
        if (date) {
          query = query.eq("date", date);
        }
        const { data, error } = await query;
        if (error) {
          console.error("[GET] Supabase error:", error);
          throw error;
        }
        bookings = (data || []).map(mapRowToBooking);
        console.log(`[GET] Retrieved ${bookings.length} bookings from Supabase`);
      } catch (supabaseError) {
        console.log("[GET] Falling back to in-memory storage");
        bookings = date
          ? inMemoryBookings.filter(b => b.date === date)
          : inMemoryBookings;
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings }),
      };
    }

    // POST /api/bookings
    if (method === "POST" && (path === "/api/bookings" || path === "/bookings")) {
      const { name, startTime, endTime, date } = body;

      console.log("[POST] Received:", { name, startTime, endTime, date });

      if (!name || !startTime || !endTime || !date) {
        console.error("[POST] Missing fields!");
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Missing required fields",
            received: { name, startTime, endTime, date }
          }),
        };
      }

      const bookingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const booking: Booking = { id: bookingId, name, startTime, endTime, date };

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
          console.error("[POST] Supabase error:", error);
          throw error;
        }

        console.log("[POST] Created booking in Supabase:", bookingId);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking: mapRowToBooking(data) }),
        };
      } catch (supabaseError) {
        console.log("[POST] Falling back to in-memory storage");
        inMemoryBookings.push(booking);
        console.log("[POST] Created booking in memory:", bookingId);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking }),
        };
      }
    }

    // DELETE /api/bookings/:id
    if (method === "DELETE" && (path?.match(/\/api\/bookings\//) || path?.match(/\/bookings\//))) {
      const id = path.split("/").pop();
      console.log(`[DELETE] Attempting to delete ${id}...`);

      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("[DELETE] Supabase error:", error);
          throw error;
        }

        console.log(`[DELETE] Deleted from Supabase: ${id}`);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: true }),
        };
      } catch (supabaseError) {
        console.log("[DELETE] Falling back to in-memory storage");
        const index = inMemoryBookings.findIndex(b => b.id === id);

        if (index === -1) {
          return {
            statusCode: 404,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Booking not found" }),
          };
        }

        inMemoryBookings.splice(index, 1);
        console.log(`[DELETE] Deleted from memory: ${id}`);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: true }),
        };
      }
    }

    // GET /api/health
    if (method === "GET" && (path === "/api/health" || path === "/health")) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "ok",
          supabaseUrl: process.env.SUPABASE_URL ? "set" : "not set",
          supabaseKey: process.env.SUPABASE_ANON_KEY ? "set" : "not set",
          env: process.env.NODE_ENV || "development",
        }),
      };
    }

    // 404
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not found" }),
    };
  } catch (error) {
    console.error("[Handler] Error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  }
};
