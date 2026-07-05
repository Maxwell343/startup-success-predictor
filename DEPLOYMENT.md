# Deployment Guide: Startup Predictor

This guide provides step-by-step instructions for deploying the Startup Predictor application in production, with the backend hosted on **Render** and the frontend hosted on **Vercel**.

---

## 1. Backend Deployment (Render)

Render will host the FastAPI Python server and serve the machine learning model.

### Prerequisites
- A Render account (free tier is sufficient).
- Your repository pushed to GitHub or GitLab.

### Steps
1. Log in to the [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository containing this project.
4. Configure the Web Service settings:
   - **Name**: `startup-predictor-backend` (or your choice)
   - **Environment**: `Python 3`
   - **Region**: Choose the region closest to your users.
   - **Branch**: `main` (or the branch you are deploying)
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Expand the **Advanced** section and add the following **Environment Variables**:
   - `ALLOWED_ORIGINS`: Set this to your frontend URL once Vercel is deployed (e.g. `https://your-app.vercel.app`), or use `*` to allow all origins temporarily.
6. Click **Create Web Service**.

Once deployed, Render will provide a public URL for your backend (e.g. `https://startup-predictor-backend.onrender.com`). Take note of this URL; it will be required for the frontend.

---

## 2. Frontend Deployment (Vercel)

Vercel will host the static built files of the React/Vite application.

### Prerequisites
- A Vercel account (free Hobby plan is sufficient).
- Vercel CLI installed locally (optional, web dashboard is recommended).

### Steps via Vercel Web Dashboard
1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** and select **Project**.
3. Import your GitHub repository containing this project.
4. Configure the Project settings:
   - **Project Name**: `startup-predictor` (or your choice)
   - **Framework Preset**: `Vite` (Vercel will auto-detect this once you set the root directory)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add the following variable:
   - **Key**: `VITE_API_URL`
   - **Value**: The public URL of your Render backend service (e.g. `https://startup-predictor-backend.onrender.com`). Do not append a trailing slash.
6. Click **Deploy**.

Vercel will build the React application from source, injecting your backend URL at compile time, and host the static files.

---

## 3. Post-Deployment Verification

1. Open your Vercel deployment URL (e.g. `https://startup-predictor.vercel.app`).
2. Fill in the startup metrics form with test data.
3. Click the prediction button.
4. Ensure the prediction results dashboard displays and recommendations are computed successfully without console errors.
