/**
 * Application configuration
 * Provides centralized access to environment variables and settings
 */

export const config = {
  // Demo mode - uses deterministic timestamps for reproducible demos
  isDemoMode: process.env.DEMO_MODE === 'true',

  // Database configuration
  database: {
    url: process.env.DATABASE_URL || './data/call-center.db',
  },

  // Polling intervals (in milliseconds)
  polling: {
    feed: 10000, // 10 seconds
    alerts: 15000, // 15 seconds
    stats: 20000, // 20 seconds
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
} as const;

// Type for the config object
export type AppConfig = typeof config;
