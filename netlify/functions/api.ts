import serverless from "serverless-http";
import { createServer } from "../../server";

console.log("Initializing Netlify API function...");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "set" : "not set");
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "set" : "not set");

let app: any;
let handler: any;

try {
  app = createServer();
  console.log("Express app created successfully");

  handler = serverless(app);
  console.log("Serverless-http handler created successfully");
} catch (error) {
  console.error("Error initializing Netlify function:", error);
  // Return a function that will handle all requests with an error
  handler = async (event: any) => {
    console.error("Request handler called, but function initialization failed");
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: "Server initialization failed",
        details: error instanceof Error ? error.message : String(error)
      }),
      headers: { "Content-Type": "application/json" },
    };
  };
}

export { handler };
