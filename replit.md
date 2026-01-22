# Call Center Intelligence

A Next.js-based call center intelligence dashboard application for monitoring customer service cases, alerts, and trending topics.

## Overview

This is a ThaiBev Call Center Intelligence dashboard that provides:
- Real-time monitoring of customer service cases
- Alert management for critical issues
- Trending topics analysis
- Case management and uploads
- Analytics dashboard

## Tech Stack

- **Framework**: Next.js 16.1.4 with Turbopack
- **Language**: TypeScript
- **Database**: SQLite with better-sqlite3
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS v4
- **i18n**: next-intl for internationalization

## Project Structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── [locale]/          # Internationalized pages
│   └── api/               # API endpoints
├── components/            # React components
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
│   ├── db/               # Database setup and schema
│   │   ├── index.ts      # Database connection
│   │   ├── schema.ts     # Drizzle schema definitions
│   │   └── seed.ts       # Database seeding script
│   └── ...
├── messages/              # i18n translation files
└── public/               # Static assets
```

## Development

### Running the Development Server

The application runs on port 5000:

```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

### Database Commands

- **Seed the database**: `npm run db:seed`
- **Push schema changes**: `npm run db:push`
- **Generate migrations**: `npm run db:generate`
- **Open Drizzle Studio**: `npm run db:studio`

### Database Location

The SQLite database is stored at `/home/runner/workspace/data/call-center.db`. The seed script creates sample data including:
- 17 users
- 2000+ cases
- 8 alerts
- 7 trending topics
- 14 feed items

## Configuration

### Next.js Configuration

The `next.config.ts` includes:
- React Compiler support
- next-intl plugin for i18n
- Allowed dev origins for Replit proxy support

### Environment Variables

- `DATABASE_URL`: Override the default SQLite database path (optional). Note: PostgreSQL URLs are automatically ignored; the app uses SQLite only.

## Deployment

For production deployment:
1. Build the application: `npm run build`
2. Start the production server: `npm run start`

Note: The SQLite database will need to be configured with proper persistence for production use.
