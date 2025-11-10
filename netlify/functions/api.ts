import serverless from "serverless-http";
import { createServer } from "../../server";

let app: any;
let handler: any;

try {
  app = createServer();
  handler = serverless(app);
} catch (error) {
  console.error("Error initializing Netlify function:", error);
  // Return a function that will handle all requests with an error
  handler = async (event: any) => {
    return {
      statusCode: 503,
      body: JSON.stringify({ error: "Server initialization failed. Please check environment variables." }),
    };
  };
}

export { handler };
