# TinyLink Backend

URL Shortener backend following company coding standards.

## Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your database credentials

# Create database (in PostgreSQL)
createdb tinylink

# Initialize tables
npm run db:init
```

## Commands

```bash
# Initialize database
npm run db:init

# Fix constraints
npm run db:fix-constraints

# Build
npm run build

# Start server
npm start
```

## Structure

```
src/
├── components/
│   ├── users/users.table.ts
│   ├── links/links.table.ts
│   └── clicks/clicks.table.ts
├── util/
│   ├── server-commons.ts    # ISess logging
│   ├── types.ts             # Type definitions
│   ├── db-util.ts           # Database singleton
│   └── ddl-util.ts          # DDL operations
└── main.ts                  # Entry point
```

## Database

- **Users**: id, email, password_hash, name, timestamps
- **Links**: id, user_id, short_code, target_url, clicks, timestamps
- **Clicks**: id, link_id, ip_address, user_agent, browser, os, device, country, city, timestamps
