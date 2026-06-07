import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";

export function getDb() {
  const context = getRequestContext();
  if (!context || !context.env || !context.env.DB) {
    throw new Error(
      'D1 binding DB is not available in the current context. Make sure your route runs in the Edge runtime (export const runtime = "edge").',
    );
  }
  return drizzle(context.env.DB);
}
