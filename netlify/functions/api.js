// Simple Netlify function that handles API requests
// This creates a minimal Express server for API routes

export const handler = async (event, context) => {
  // Parse the incoming request
  const method = event.httpMethod;
  const path = event.path || "/";
  const body = event.body ? JSON.parse(event.body) : {};
  
  console.log(`[API] ${method} ${path}`, body);

  // Route: GET /api/bookings
  if (method === "GET" && path === "/api/bookings") {
    const bookings = []; // In-memory storage
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookings }),
    };
  }

  // Route: POST /api/bookings  
  if (method === "POST" && path === "/api/bookings") {
    console.log("Received booking data:", body);
    
    const { name, startTime, endTime, date } = body;
    
    if (!name || !startTime || !endTime || !date) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "Missing required fields",
          received: { name, startTime, endTime, date }
        }),
      };
    }
    
    const booking = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      startTime,
      endTime,
      date,
    };
    
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking }),
    };
  }

  // Route: GET /api/health
  if (method === "GET" && path === "/api/health") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ok",
        supabaseUrl: process.env.SUPABASE_URL ? "set" : "not set",
        supabaseKey: process.env.SUPABASE_ANON_KEY ? "set" : "not set",
      }),
    };
  }

  // Default 404
  return {
    statusCode: 404,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Not found" }),
  };
};
