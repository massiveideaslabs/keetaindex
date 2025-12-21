# Keeta.Dev Backend API

Express + TypeScript backend API for Keeta.Dev project directory.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your database URL:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/keeta_dev
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Railway Deployment

1. Create a PostgreSQL database service in Railway
2. Create a new Node.js service for the backend
3. Set environment variables:
   - `DATABASE_URL` (automatically provided by Railway PostgreSQL service)
   - `PORT` (automatically set by Railway)
   - `FRONTEND_URL` (your frontend URL for CORS)

4. The backend will automatically run migrations on startup if needed

## API Endpoints

### Apps
- `GET /api/apps` - Get all apps
- `POST /api/apps` - Add new app
- `PUT /api/apps/:id` - Update app
- `DELETE /api/apps/:id` - Delete app
- `PATCH /api/apps/:id/clicks` - Increment app clicks

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Add report
- `DELETE /api/reports/:id` - Delete report
- `DELETE /api/reports/app/:appId` - Delete all reports for an app

### Health
- `GET /health` - Health check endpoint

