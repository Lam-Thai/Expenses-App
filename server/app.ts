// server/app.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { expensesRoute } from "./routes/expenses";
import { cors } from "hono/cors";
import { authRoute } from "./auth/kinde";
import { secureRoute } from "./routes/secure";
import { uploadRoute } from "./routes/upload";
import { healthRoute } from "./routes/health";
import { serveStatic } from "@hono/node-server/serve-static";

export const app = new Hono();

// Global logger
app.use("*", logger());

// Add CORS middleware for API routes
app.use(
  "/api/*",
  cors({
    origin: [
      "http://localhost:5173",
      // Add your Render.com domain
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Custom timing middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  c.header("X-Response-Time", `${ms}ms`);
});

// API Routes - define these BEFORE static/fallback handlers
app.route("/api/expenses", expensesRoute);
app.route("/api/auth", authRoute);
app.route("/api/secure", secureRoute);
app.route("/api/upload", uploadRoute);
app.route("/health", healthRoute);

// Serve static files from public directory
app.use("/*", serveStatic({ root: "./server/public" }));

// SPA fallback for client-side routing
app.get("*", async (c) => {
  const url = new URL(c.req.url);
  // Skip API routes
  if (url.pathname.startsWith("/api")) return c.notFound();

  // Serve index.html for all other routes
  try {
    // Use Node.js fs instead of Bun.file
    const html = await import("fs/promises").then((fs) =>
      fs.readFile("./server/public/index.html", "utf-8")
    );
    return c.html(html);
  } catch (error) {
    console.error("Failed to serve index.html:", error);
    return c.text("Internal Server Error", 500);
  }
});
