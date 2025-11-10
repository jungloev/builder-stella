// Raw Netlify function handler - avoid serverless-http complexity

interface Booking {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  date: string;
}

const bookings: Booking[] = [];

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
      const filtered = date
        ? bookings.filter(b => b.date === date)
        : bookings;
      
      console.log(`[GET] Found ${filtered.length} bookings`);
      
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings: filtered }),
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

      const booking: Booking = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        startTime,
        endTime,
        date,
      };

      bookings.push(booking);
      console.log("[POST] Created booking:", booking.id);
      console.log("[POST] Total bookings:", bookings.length);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking }),
      };
    }

    // DELETE /api/bookings/:id
    if (method === "DELETE" && (path?.match(/\/api\/bookings\//) || path?.match(/\/bookings\//))) {
      const id = path.split("/").pop();
      const index = bookings.findIndex(b => b.id === id);

      console.log(`[DELETE] Looking for ${id}...`);

      if (index === -1) {
        return {
          statusCode: 404,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: "Booking not found" }),
        };
      }

      bookings.splice(index, 1);
      console.log(`[DELETE] Deleted. Remaining: ${bookings.length}`);

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: true }),
      };
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
          bookingsInMemory: bookings.length,
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
