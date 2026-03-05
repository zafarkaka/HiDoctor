# 🚀 HiDoctor - The Ultimate Turnkey Production Deployment Guide

This guide is completely foolproof and designed for beginners. It tells you exactly **what file to open**, **what line to edit**, and **which button to click** across all platforms. Follow this guide from top to bottom without skipping any steps.

This deployment solution uses:
- **Database**: MongoDB Atlas
- **Backend**: Railway.app (running your FastAPI Docker container)
- **Frontend**: Vercel (running your React app)
- **Mobile**: Google Play Store (via Expo Application Services)

---

## 📂 Project Structure Overview

Your code is divided into three main folders:
1. `backend/` - The Python server. This runs in a Docker container hosted on Railway.
2. `frontend/` - The Web App (React). This is hosted on Vercel.
3. `mobile/` - The Android App (React Native/Expo). This builds into an `.aab` file for the Google Play Store.

---

## 🗄️ Step 1: Set up the Database (MongoDB Atlas)

We need a live database online before anything else will work.

1. **Go to** [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register) in your web browser.
2. **Sign up** or sign in using a Google account.
3. Once logged in, you will be prompted to deploy a database. If not, click **"Build a Database"**.
4. **Choose** the **"M0 Free"** tier.
5. **Provider**: AWS (or default), **Region**: Choose the one closest to you.
6. **Click** the green **"Create"** button at the bottom.
7. Next, secure your connection:
   - Under **"Username and Password"**, type a username (e.g., `admin`).
   - Click **"Autogenerate Secure Password"** (or type your own).
   - **CRITICAL**: Copy this password and paste it somewhere safe (like a notepad).
   - **Click** the **"Create User"** button.
8. Under **"Where would you like to connect from?"**, select **"My Local Environment"**.
9. In the IP Address list, edit the IP address to be `0.0.0.0/0` (This means "allow access from anywhere", which is required for cloud hosting). Click **"Add Entry"**.
10. **Click** **"Finish and Close"**, then **"Go to Databases"**.
11. On your cluster dashboard, click the **"Connect"** button.
12. Click **"Drivers"** (under Connect to your application).
13. Copy the **Connection String** provided. It will look exactly like this:
    `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
14. Replace `<password>` in that string with the password you saved earlier. Replace the `/?` with `/hidoctor?` so it uses a specific database name. Your final string should look like:
    `mongodb+srv://admin:mysecretpassword@cluster0.abcde.mongodb.net/hidoctor?retryWrites=true&w=majority`

**Keep this string handy for Step 2!**

---

## ⚙️ Step 2: Prepare Backend and Frontend Configuration Files

Before deploying, we need to create the `.env` (environment) files inside your actual project folders.

### 1. The Backend Environment File (`backend/.env`)
1. In your code editor, open the `backend/` folder.
2. Create a new file named exactly: `.env`
3. Paste the following text into it. Replace `YOUR_MONGODB_STRING_HERE` with the string from Step 1.

```bash
# PASTE YOUR MONGODB STRING HERE:
MONGO_URL=YOUR_MONGODB_STRING_HERE

# Database name
DB_NAME=hidoctor

# Random secret key for security (you can leave this as is, or mash your keyboard)
JWT_SECRET=super_secret_jwt_key_987654321

# We will update these later during deployment
BACKEND_URL=http://localhost:8001
FRONTEND_URL=http://localhost:3000
PORT=8001
```

*(Note: The `backend/Dockerfile` has already been created and tuned for production. You do not need to touch it!)*

### 2. The Frontend Environment File (`frontend/.env.production`)
1. In your code editor, open the `frontend/` folder.
2. Create a new file named exactly: `.env.production`
3. Paste this into it:
```bash
# We will update this domain in Step 4
REACT_APP_BACKEND_URL=http://localhost:8001
```

### 3. Save your code and upload to GitHub
1. You **must** upload your entire `DOCTOR/archive` project to a private repository on [GitHub](https://github.com).
2. Ensure everything (backend, frontend, mobile) is pushed to the `main` branch.

---

## ☁️ Step 3: Deploy Backend to Railway.app (Easiest Method)

We will deploy the `backend/` folder Docker container to Railway.

1. **Go to** [https://railway.app](https://railway.app) and click **"Login"** (use your GitHub account).
2. In the Railway dashboard, click the **"New Project"** button.
3. Click **"Deploy from GitHub repo"**.
4. Select your newly created `HiDoctor` repository.
5. **IMPORTANT (Fixing the path)**: Because your project has 3 folders, we need to tell Railway to only look at the `. /backend` folder.
   - Click on the newly created deployment box in Railway.
   - Go to the **"Settings"** tab.
   - Scroll down to **"Root Directory"** and type `/backend`. Press Enter.
6. **Set the Start Command**:
   - Stay in the **"Settings"** tab.
   - Scroll down to **"Start Command"** and paste this exactly:
     `gunicorn server:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
   - Press Enter.
7. **Set Variables**:
   - Now go to the **"Variables"** tab at the top.
   - Click **"New Variable"** and add these EXACTLY as you put in your `backend/.env` file:
     * Variable Name: `MONGO_URL` | Value: `put_your_mongodb_string_here`
     * Variable Name: `DB_NAME` | Value: `hidoctor`
     * Variable Name: `JWT_SECRET` | Value: `super_secret_jwt_key_987654321`
     *(Do NOT add `PORT`, Railway handles routing automatically)*
8. **Get your Live URL**:
   - Go back to the **"Settings"** tab, scroll to **"Networking"**, and click **"Generate Domain"**.
   - **COPY THAT URL** (e.g., `https://hidoctor-production.up.railway.app`). This is your Live API!

---

## 🌍 Step 4: Deploy Frontend to Vercel

We will deploy the `frontend/` folder to Vercel.

1. **Go to** [https://vercel.com](https://vercel.com) and Sign In with GitHub.
2. Click the black **"Add New..."** button at the top right, and select **"Project"**.
3. Next to your `HiDoctor` GitHub repository, click **"Import"**.
4. **CRITICAL STEP**: On the Configuration screen, look for **"Root Directory"**. Click the **"Edit"** button, select the `frontend` folder, and click "Continue".
5. Unfurl the **"Environment Variables"** section.
6. Add your backend connection variable:
   - Name: `REACT_APP_BACKEND_URL`
   - Value: `PASTE_THE_URL_YOU_GOT_FROM_RAILWAY_IN_STEP_3` (e.g., `https://hidoctor-production.up.railway.app`)
7. Click the **"Add"** button.
8. Click the big blue **"Deploy"** button.
9. Wait 2 minutes. Vercel will give you a live frontend URL (e.g., `https://hidoctor-frontend.vercel.app`).

### Final Backend Linkage (CORS Fix)
Your backend needs to know it's allowed to talk to your new Vercel website.
1. Go **back** to Railway.app.
2. Click your backend service -> **"Variables"** tab.
3. Click "New Variable":
   - Name: `FRONTEND_URL`
   - Value: `PASTE_THE_URL_YOU_GOT_FROM_VERCEL_IN_STEP_4`
4. Adding a variable will automatically restart the backend server so it takes effect. **Your web app is now fully live!**

---

## 📱 Step 5: Android App to Google Play Store (React Native / Expo)

We must package the `mobile/` folder into an `.aab` (Android App Bundle) file for the Google Play Store.

### 1. Verify App Configurations in `mobile/app.json`
Your `mobile/app.json` has already been configured for production, but double check:
1. Open `mobile/app.json`.
2. Look at `"android": { "package": "com.hidoctor.app" }`. This is your unique Store ID. You can change this to `com.yourcompany.hidoctor` if desired.
3. Look at `"versionCode": 1`. Every time you update the app on the Play Store in the future, you must increase this number to 2, 3, 4, etc.

### 2. Set backend URL in mobile
1. Open `mobile/src/config.js` or `mobile/src/api.js` (wherever your backend connection is).
2. Ensure you change the URL from `http://10.0.2.2:8001` to your public Railway domain: `https://hidoctor-production.up.railway.app`.

### 3. Build the Production Application using EAS
You don't need Android Studio or complex signing keys. Expo handles the cryptography signing for you.
1. Open a terminal on your computer.
2. Navigate to your mobile folder: `cd mobile`
3. Install the EAS tool globally on your computer:
   `npm install -g eas-cli`
4. Log into your Expo account (Create one at [expo.dev](https://expo.dev) if needed):
   `eas login`
5. Run the build command to generate the Play Store file:
   `eas build --platform android --profile production`
6. It will ask: *"Would you like to generate a new Android Keystore?"* 
   Press **"Y"** (Yes) and hit Enter. Expo will create and secure the cryptography signing keys for you!
7. Wait 15-30 minutes for the build to finish (it will provide a link to the Expo website where you can see a progress bar).
8. When done, click the link to **Download your `.aab` file...** to your computer.

### 4. Upload to Google Play Console
1. Go to the [Google Play Console](https://play.google.com/console) (Requires a one-time $25 developer fee).
2. Click **"Create app"** in the top right.
3. Fill in the App name ("HiDoctor"), set it as "App" and "Free", and accept the developer policies.
4. On the dashboard, scroll down the left sidebar to **"Release"** -> **"Production"**.
5. Click **"Create new release"** in the top right corner.
6. Google will ask about "App Signing". Click **"Continue"** or "Use Google Play App Signing" (Highly Recommended).
7. Under "App bundles and APKs", click the **"Upload"** button and locate the `.aab` file you downloaded from Expo.
8. Scroll down and fill out the "Release details" (Write "Initial release of HiDoctor").
9. Click **"Next"** and then **"Save"**.
10. **Final Tasks before Launch**: You will have to fill out the App Content surveys (Privacy Policy URL, Data Safety, Target Audience) located at the very bottom of the left sidebar under "Policy -> App content". Once those get green checkmarks, you can go back to "Production" and hit **"Rollout to Production"**. 
11. **Wait for Approval**: Google will review your app. It usually takes 1-3 days for a new app!

---

## 💻 Step 6: Testing Docker Locally (Optional but Recommended)

Before you upload everything to Railway or Vercel, you should test the Docker container on your own computer.

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) on your Windows/Mac.
2. Ensure Docker Desktop is running in the background.
3. Open a terminal in the root `archive/` folder.
4. Run this exact command:
   `docker-compose up --build`
5. Docker will build the entire backend container using the `Dockerfile` and start it on port 8001.
6. Open your web browser and go to `http://localhost:8001/api/health`.
7. If you see `{"status": "healthy"}`, your production Docker container is perfect. Press `Ctrl+C` in the terminal to stop it.

---

🎉 **You are completely done! Follow these steps exactly and your Turnkey system will be live.**
