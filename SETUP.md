# Quick Setup Guide

## Local Development

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
npm run migrate
npm run dev
```

### 2. Frontend Setup
```bash
# In root directory
npm install
cp .env.example .env
# Edit .env with VITE_API_URL=http://localhost:3001
npm run dev
```

## Railway Deployment

1. **Create PostgreSQL Database** in Railway dashboard
2. **Deploy Backend**:
   - Connect repository or upload `backend/` folder
   - Set root directory to `backend/`
   - Link PostgreSQL database (DATABASE_URL auto-set)
   - Set FRONTEND_URL environment variable
3. **Update Frontend**:
   - Set VITE_API_URL to your Railway backend URL
   - Redeploy frontend

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions.

