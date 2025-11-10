import serverless from "serverless-http";
import { createServer } from "../../server";

// Create the Express app
const app = createServer();

// Wrap the Express app with serverless-http
export const handler = serverless(app);
