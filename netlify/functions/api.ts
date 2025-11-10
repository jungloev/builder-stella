import serverless from "serverless-http";
import { createServer } from "../../server";

// Wrap the Express app with serverless-http
// The lambda function already handles path stripping, so we just need to wrap the app
let app: any;

try {
  app = createServer();
} catch (error) {
  console.error("Error creating server:", error);
  throw error;
}

// Export the handler
export const handler = serverless(app, {
  // Add request/response logging
  request: (request: any) => {
    console.log(`${request.method} ${request.path}`);
  },
});
