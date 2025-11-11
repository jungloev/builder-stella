interface Booking {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  date: string;
}

const inMemoryBookings: Booking[] = [];

function getSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase environment variables. URL: ${supabaseUrl ? "set" : "missing"}, KEY: ${supabaseKey ? "set" : "missing"}`
    );
  }

  return { supabaseUrl, supabaseKey };
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

async function getBookingsFromSupabase(date?: string): Promise<Booking[]> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  let url = `${supabaseUrl}/rest/v1/bookings?select=*`;
  if (date) {
    url += `&date=eq.${encodeURIComponent(date)}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase GET error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return (data || []).map(mapRowToBooking);
}

async function createBookingInSupabase(booking: Booking): Promise<Booking> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: booking.id,
      name: booking.name,
      start_time: booking.startTime,
      end_time: booking.endTime,
      date: booking.date,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase POST error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return mapRowToBooking(data[0] || data);
}

async function deleteBookingFromSupabase(id: string): Promise<void> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  const response = await fetch(`${supabaseUrl}/rest/v1/bookings?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase DELETE error: ${response.status} ${errorText}`);
  }
}

export const handler = async (event: any) => {
  try {
    const method = event.httpMethod;
    const path = event.path;

    let body: any = {};
    if (event.body) {
      try {
        body =
          typeof event.body === "string" ? JSON.parse(event.body) : event.body;
      } catch (e) {
        console.error("Failed to parse body:", event.body);
      }
    }

    console.log(`[${method}] ${path}`, {
      bodyKeys: Object.keys(body),
      bodyLength: JSON.stringify(body).length,
    });

    if (
      method === "GET" &&
      (path === "/api/bookings" || path === "/bookings")
    ) {
      const date = event.queryStringParameters?.date;
      let bookings: Booking[] = [];

      try {
        bookings = await getBookingsFromSupabase(date);
        console.log(
          `[GET] Retrieved ${bookings.length} bookings from Supabase`
        );
      } catch (supabaseError) {
        console.error("[GET] Supabase error:", supabaseError);
        console.log("[GET] Falling back to in-memory storage");
        bookings = date
          ? inMemoryBookings.filter((b) => b.date === date)
          : inMemoryBookings;
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings }),
      };
    }

    if (
      method === "POST" &&
      (path === "/api/bookings" || path === "/bookings")
    ) {
      const { name, startTime, endTime, date } = body;

      console.log("[POST] Received:", { name, startTime, endTime, date });

      if (!name || !startTime || !endTime || !date) {
        console.error("[POST] Missing fields!");
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            error: "Missing required fields",
            received: { name, startTime, endTime, date },
          }),
        };
      }

      const bookingId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const booking: Booking = {
        id: bookingId,
        name,
        startTime,
        endTime,
        date,
      };

      try {
        const result = await createBookingInSupabase(booking);
        console.log("[POST] Created booking in Supabase:", bookingId);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ booking: result }),
        };
      } catch (supabaseError) {
        console.error("[POST] Supabase error:", supabaseError);
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

    if (
      method === "DELETE" &&
      (path?.match(/\/api\/bookings\//) || path?.match(/\/bookings\//))
    ) {
      const id = path.split("/").pop();
      console.log(`[DELETE] Attempting to delete ${id}...`);

      try {
        await deleteBookingFromSupabase(id!);
        console.log(`[DELETE] Deleted from Supabase: ${id}`);
        return {
          statusCode: 200,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ success: true }),
        };
      } catch (supabaseError) {
        console.error("[DELETE] Supabase error:", supabaseError);
        console.log("[DELETE] Falling back to in-memory storage");
        const index = inMemoryBookings.findIndex((b) => b.id === id);

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
        details: error instanceof Error ? error.message : String(error),
      }),
    };
  }
};
