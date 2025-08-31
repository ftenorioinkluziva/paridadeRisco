# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ParidadeRisco is a financial risk parity dashboard built with the T3 Stack. It's a modern Next.js application that tracks and analyzes Brazilian financial assets (ETFs, CDI, stocks) with portfolio management capabilities.

## Architecture

### T3 Stack Application (Next.js Full-Stack)
- **Framework**: Next.js 14 with App Router
- **Frontend**: React 18 with TypeScript
- **API Layer**: tRPC for end-to-end type safety
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Prisma adapter
- **Styling**: Tailwind CSS with shadcn/ui components
- **Testing**: Vitest (unit) and Playwright (e2e)

### Key Architecture Components
- **API Routes**: tRPC routers in `src/server/api/routers/` (auth, asset, portfolio, cesta)
- **Database Schema**: Prisma schema with User, Portfolio, Ativo, Cesta, Transacao models
- **UI Components**: shadcn/ui based components in `src/components/ui/`
- **Layout**: Header navigation with theme toggle and user management
- **Services**: Financial data fetcher service in `src/server/services/`

### Database Model Structure
Core entities and relationships:
- **User** → **Portfolio** (1:1) for cash balance tracking
- **User** → **Cesta** (1:many) for custom asset baskets
- **Cesta** ↔ **Ativo** (many:many) via AtivosEmCestas with target percentages
- **Ativo** → **DadoHistorico** (1:many) for price/percentage data
- **User** → **Transacao** (1:many) for buy/sell transactions

## Development Commands

### Essential Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database commands
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:migrate   # Run database migrations
```

### Testing
```bash
# Run unit tests
npm test
npm run test:run     # Run once without watch

# Run e2e tests
npm run test:e2e
npm run test:e2e:ui  # With Playwright UI

# Run all tests
npm run test:all
```

### Code Quality
```bash
# Lint code
npm run lint

# Generate Prisma client (runs automatically on install)
npm run postinstall
```

## Environment Setup

Create `.env` file with required variables:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

## Development Server URLs

- **Application**: http://localhost:3000
- **Prisma Studio**: Available via `npm run db:studio`

## tRPC API Structure

The API is organized into these routers:
- `auth`: User authentication and registration
- `asset`: Asset management and historical data
- `portfolio`: Portfolio operations and cash balance
- `cesta`: Basket creation and asset allocation

Access via tRPC client in components or use direct API routes at `/api/trpc/[trpc]`