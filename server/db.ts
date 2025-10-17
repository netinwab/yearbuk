import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from "postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const queryClient = postgres(process.env.DATABASE_URL, {
  // Add connection options for better error handling
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  // Handle connection errors gracefully
  onnotice: () => {}, // Suppress notices
});

export const db = drizzle(queryClient, { schema });
