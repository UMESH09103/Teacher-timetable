# 🚀 Deploying to Render.com as a Web Service

This repository is fully configured for deployment on [Render.com](https://render.com) as a single, unified **Web Service** that serves both the Express API and the React frontend.

---

## 📋 Render Dashboard Settings (Step-by-Step)

### Option 1: Automatic Deployment (Render Blueprint)
1. In your Render Dashboard, click **New +** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will automatically detect [`render.yaml`](./render.yaml) and configure the build and start commands.
4. Fill in the required environment variable: `MONGO_URI`.
5. Click **Apply**.

---

### Option 2: Manual Web Service Setup
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `UMESH09103/Teacher-timetable`.
4. Configure the service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `school-smart-timetable` (or your preferred name) |
| **Region** | Singapore, Oregon, or closest to your location |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm run render-build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

5. Under **Environment Variables**, add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production mode and static React serving |
| `MONGO_URI` | `mongodb+srv://umeshrj629_db_user:zgquxoAHv8m60A6u@cluster0.k2unxd6.mongodb.net/school_timetable?retryWrites=true&w=majority&appName=Cluster0` | Your MongoDB Atlas connection link |
| `JWT_SECRET` | `super_secret_jwt_school_timetable_key_2026_x89!` | Or generate a random secure string |

6. (Optional) Under **Advanced**:
   - **Health Check Path**: `/api/health`

7. Click **Create Web Service**.

---

## ⚙️ How It Works Under the Hood

1. **Build Step (`npm run render-build`)**:
   - Installs backend dependencies.
   - Installs frontend dependencies.
   - Compiles the React/Vite app into `frontend/dist/`.

2. **Start Step (`npm start`)**:
   - Starts `backend/server.js` on Render's assigned port (`process.env.PORT`).
   - Serves the compiled React app for all browser routes (`/*`).
   - Handles all API requests under (`/api/*`).
   - Connects directly to your MongoDB Atlas cluster.
