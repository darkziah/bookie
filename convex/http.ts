import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Helper to add CORS headers and clean up corrupted JSON
const wrapResponse = async (res: Response, url: string) => {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, Convex-Client");
  headers.set("Access-Control-Max-Age", "86400");

  // If the response is not 200, or not a discovery route, just add CORS and return
  if (res.status !== 200 || !url.includes(".well-known/")) {
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });
  }

  // For discovery routes, we need to consume the body to clean it
  const body = await res.text();

  // Extract JSON content between braces to strip trailing secrets or quote wrapping
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    const cleanedBody = body.substring(start, end + 1);

    // Validate it's actually JSON
    try {
      JSON.parse(cleanedBody);
      headers.set("Content-Type", "application/json");
      return new Response(cleanedBody, {
        status: 200,
        headers,
      });
    } catch (e) {
      // If parsing fails, fall back to the raw body
    }
  }

  return new Response(body, {
    status: 200,
    headers,
  });
};

// Wrap http.route to automatically add CORS headers to all routes
const originalRoute = http.route;
http.route = (spec: any) => {
  if (!spec || !spec.handler) return originalRoute.call(http, spec);
  const originalHandler = spec.handler;

  spec.handler = httpAction(async (ctx, request) => {
    // Call the original handler
    const response = await originalHandler(ctx, request);
    // Wrap the response with CORS and cleanup logic
    return await wrapResponse(response, request.url);
  });

  return originalRoute.call(http, spec);
};

// Handle OPTIONS for all auth-related routes
const authPaths = [
  "/.well-known/openid-configuration",
  "/.well-known/jwks.json",
  "/oauth/authorize",
  "/oauth/token",
  "/oauth/userinfo",
];

for (const path of authPaths) {
  http.route({
    path,
    method: "OPTIONS",
    handler: httpAction(async () => {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Convex-Client",
          "Access-Control-Max-Age": "86400",
        },
      });
    }),
  });
}

auth.addHttpRoutes(http);

export default http;
