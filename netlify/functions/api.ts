import serverless from "serverless-http";
import { createServer } from "../../server";

console.log("Initializing Netlify API function...");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "set" : "not set");
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "set" : "not set");

let app: any;
let slsHandler: any;

try {
  app = createServer();
  console.log("Express app created successfully");

  slsHandler = serverless(app, {
    // Ensure body is properly handled
    parseQueryStringParameters: true,
  });
  console.log("Serverless-http handler created successfully");
} catch (error) {
  console.error("Error initializing Netlify function:", error);
  slsHandler = null;
}

export const handler = async (event: any, context: any) => {
  console.log("[API Handler] Received event:");
  console.log("  Method:", event.httpMethod);
  console.log("  Path:", event.path);
  console.log("  Body type:", typeof event.body);
  console.log("  Body length:", event.body ? event.body.length : 0);
  console.log("  Headers:", event.headers);

  if (!slsHandler) {
    console.error("[API Handler] Handler not initialized");
    return {
      statusCode: 503,
      body: JSON.stringify({
        error: "Server initialization failed",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const response = await slsHandler(event, context);
    console.log("[API Handler] Response status:", response.statusCode);
    return response;
  } catch (error) {
    console.error("[API Handler] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error)
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
