# Pre-Live Deployment Checklist: Startup Predictor

Complete this checklist step-by-step before declaring the application live in production.

## Phase 1: Local Pre-Commit Verification
- [x] Verify no localhost URLs are hardcoded in the frontend source code (checked `frontend/src/utils/predict.ts` uses `VITE_API_URL` fallback).
- [x] Verify both duplicate python files are handled (retained `backend/main.py` as entry point and deleted `backend/app.py`).
- [x] Verify python backend requirements are dynamically generated and match imports (`backend/requirements.txt`).
- [x] Verify root-level `.gitignore` exists and excludes:
  - `node_modules/`
  - `dist/`
  - `.env`
  - `__pycache__/`
  - `*.pyc`
  - `.venv/`
  - `.DS_Store`
- [x] Verify local build succeeds (`cd frontend && npm run build` compiles with zero errors).
- [x] Verify backend server starts and resolves relative paths to models locally:
  - `uvicorn backend.main:app --port 8000` starts with no file resolution errors.

## Phase 2: Backend Deployment (Render)
- [ ] Connect repository to Render.
- [ ] Set "Root Directory" to `backend`.
- [ ] Configure Build Command: `pip install -r requirements.txt`.
- [ ] Configure Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- [ ] Verify the service deploys and shows `/health` is `{"status": "ok"}`.
- [ ] Record the public Render backend URL: `https://<your-backend-url>.onrender.com`.

## Phase 3: Frontend Deployment (Vercel)
- [ ] Connect repository to Vercel.
- [ ] Set "Root Directory" to `frontend`.
- [ ] Set Framework Preset to `Vite`.
- [ ] Configure Build Command: `npm run build`.
- [ ] Configure Output Directory: `dist`.
- [ ] Add Environment Variable:
  - Key: `VITE_API_URL`
  - Value: `<your-recorded-backend-url>` (without trailing slash)
- [ ] Deploy and verify the build finishes successfully.
- [ ] Record the public Vercel frontend URL: `https://<your-frontend-url>.vercel.app`.

## Phase 4: Production Integration & Security
- [ ] In Render settings for the backend, update the `ALLOWED_ORIGINS` environment variable to include the public Vercel URL (e.g. `https://<your-frontend-url>.vercel.app`).
- [ ] Verify CORS requests succeed by doing a prediction on the live website.
- [ ] Confirm there are no mixed content (HTTP/HTTPS) block warnings in the browser developer console.
