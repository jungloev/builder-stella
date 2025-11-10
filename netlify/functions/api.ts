import serverless from "serverless-http";
import { createServer } from "../../server";

// Wrap the Express app with serverless-http
// The lambda function already handles path stripping, so we just need to wrap the app
const app = createServer();
export const handler = serverless(app);
