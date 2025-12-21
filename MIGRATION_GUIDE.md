# Migration Guide: Firebase to Railway PostgreSQL

This guide explains how to set up and deploy the migrated Keeta.Dev application with Railway PostgreSQL backend.

## Architecture Overview

- **Frontend**: React + TypeScript + Vite (hosted on Google Cloud)
- **Backend**: Express + TypeScript API (hosted on Railway)
- **Database**: PostgreSQL (hosted on Railway)

## Local Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL (local or remote)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your database connection:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/keeta_dev
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   ```

5. Run database migrations:
   ```bash
   npm run migrate
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3001`

### Frontend Setup

1. In the root directory, create `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your backend API URL:
   ```
   VITE_API_URL=http://localhost:3001
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the frontend:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Railway Deployment

### Step 1: Create PostgreSQL Database

1. Go to [Railway Dashboard](https://railway.app)
2. Create a new project
3. Click "New" → "Database" → "Add PostgreSQL"
4. Railway will automatically create a PostgreSQL database
5. Note the `DATABASE_URL` from the database service variables

### Step 2: Deploy Backend API

1. In Railway, click "New" → "GitHub Repo" (or "Empty Project")
2. Connect your repository or upload the `backend/` folder
3. Set the root directory to `backend/` in Railway settings
4. Add environment variables:
   - `DATABASE_URL` - Automatically provided by Railway PostgreSQL service (link the database)
   - `PORT` - Automatically set by Railway (usually 3000 or 3001)
   - `FRONTEND_URL` - Your frontend URL (e.g., `https://your-frontend-domain.com`)
5. Railway will automatically:
   - Detect Node.js
   - Run `npm install`
   - Run `npm run build`
   - Start with `npm start`
6. Note the backend URL (e.g., `https://your-backend.railway.app`)

### Step 3: Update Frontend Configuration

1. Update your frontend `.env` or environment variables:
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

2. Rebuild and redeploy your frontend on Google Cloud

### Step 4: Verify Deployment

1. Check backend health: `https://your-backend.railway.app/health`
2. Test API endpoints: `https://your-backend.railway.app/api/apps`
3. Verify frontend can connect to backend

## Database Schema

### Apps Table
- `id` (UUID) - Primary key
- `name` (VARCHAR) - App name
- `description` (TEXT) - App description
- `url` (VARCHAR) - App URL
- `category` (VARCHAR) - App category
- `tags` (JSONB) - Array of tags
- `added_at` (BIGINT) - Timestamp when added
- `clicks` (INTEGER) - Click counter
- `featured` (BOOLEAN) - Featured flag

### Reports Table
- `id` (UUID) - Primary key
- `app_id` (UUID) - Foreign key to apps
- `app_name` (VARCHAR) - App name (denormalized)
- `reasons` (JSONB) - Array of report reasons
- `timestamp` (BIGINT) - Report timestamp

## API Endpoints

### Apps
- `GET /api/apps` - Get all apps
- `POST /api/apps` - Create new app
- `PUT /api/apps/:id` - Update app
- `DELETE /api/apps/:id` - Delete app
- `PATCH /api/apps/:id/clicks` - Increment clicks

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create report
- `DELETE /api/reports/:id` - Delete report
- `DELETE /api/reports/app/:appId` - Delete reports for app

## Troubleshooting

### Backend won't start
- Check `DATABASE_URL` is set correctly
- Verify PostgreSQL is accessible
- Check Railway logs for errors

### Frontend can't connect to backend
- Verify `VITE_API_URL` is set correctly
- Check CORS settings in backend
- Ensure backend is running and accessible

### Database connection errors
- Verify `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Check Railway database is running
- Verify network connectivity

## Migration Notes

- All Firebase Firestore operations have been replaced with REST API calls
- Database schema matches the original Firebase structure
- Frontend code remains largely unchanged (only `services/db.ts` was modified)
- Error handling has been updated to work with HTTP responses

