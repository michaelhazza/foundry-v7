/**
 * Database connection using postgres-js driver.
 * CRITICAL: Must use postgres-js, NOT @neondatabase/serverless.
 * Per Constitution Section D: Replit compatibility requires postgres-js driver.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

// Validate DATABASE_URL is present
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres connection
// Connection string format: postgresql://user:password@host:port/database
const connectionString = process.env.DATABASE_URL;

// Configure connection pool
const queryClient = postgres(connectionString, {
  max: 10, // Maximum connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create Drizzle ORM instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in queries
export { schema };

// Graceful shutdown handler
process.on('SIGINT', async () => {
  await queryClient.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await queryClient.end();
  process.exit(0);
});
