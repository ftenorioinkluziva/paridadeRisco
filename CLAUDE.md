# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

ParidadeRisco is a financial risk parity dashboard with a Flask backend and React frontend. It tracks and analyzes Brazilian financial assets (ETFs, CDI, stocks) with automated data updates and portfolio management capabilities.

## Architecture

### Backend (Flask API)
- **Main app**: `backend/app.py` - Flask API with PostgreSQL adapter
- **Routes**: `backend/route.py` - API endpoints for financial calculations
- **Data updates**: `backend/atualizar_dados.py` - Yahoo Finance and BCB data fetching
- **Scheduler**: `backend/scheduler_docker.py` - APScheduler for automated updates
- **Database**: PostgreSQL with adapter in `backend/postgres_adapter.py`
- **Calculations**: `backend/calculos_financeiros.py` - Financial metrics (Sharpe, volatility, drawdown)

### Frontend (React)
- **Main app**: `frontend/src/App.js` - Dashboard with chart visualization using Recharts
- **Components**: Portfolio management, basket composition, transaction tracking
- **Context**: `frontend/src/contexts/PortfolioContext.js` - Portfolio state management
- **API config**: `frontend/src/config/api.js` - Backend connection settings

### Database
- PostgreSQL with schema in `migration/init.sql`
- Tables: ativos, dados_historicos, cestas, transacoes, investment_funds, cash_balance

## Development Commands

### Using Docker (Recommended)
```bash
# Start all services (backend, frontend, postgres)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild services
docker-compose build --no-cache
```

### Backend Development
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run Flask development server
cd backend
python app.py

# Run data updates manually
python atualizar_dados.py

# Test database connection
python test_postgres.py
```

### Frontend Development
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
```
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
FLASK_ENV=development
REACT_APP_API_URL=http://localhost:5002/api
```

## Service URLs

- **Frontend**: http://localhost:8080 (Docker) or http://localhost:3000 (dev)
- **Backend API**: http://localhost:5002/api (Docker) or http://localhost:5001/api (dev)
- **PostgreSQL**: localhost:5432 (Docker) or localhost:5433

## Scheduler System

The application includes an integrated APScheduler for automated data updates:
- **08:00 daily**: Complete Yahoo Finance data update
- **Every 2 hours**: Health check verification
- RTD price updates (disabled by default)

Check scheduler status: `curl http://localhost:5002/api/scheduler/integrated/status`

## Key Financial Calculations

The system calculates standard financial metrics:
- Risk parity portfolio optimization
- Sharpe ratio, volatility, maximum drawdown
- Cumulative and annualized returns
- Moving averages and Bollinger bands

## Database Migration

Migration scripts are in `/migration/`:
```bash
# Setup database schema
python migration/create_schema.py

# Import historical data
python migration/insert_data.py
```

## Testing

Backend tests focus on API endpoints and database connections:
```bash
python backend/test_api.py
python backend/test_postgres.py
```

Frontend uses React Testing Library (standard CRA setup).