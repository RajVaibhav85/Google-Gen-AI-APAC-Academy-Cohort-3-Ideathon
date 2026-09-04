# Gemini AI Workspace - MERN + Python Stack with Firebase Authentication

A production-grade, enterprise-hardened AI application built on the **MERN (MongoDB/Firestore, Express, React, Node)** stack with a **Python RAG/ML Microservice**, engineered for the **Google GenAI Cohort 3 Ideathon** and **Cloud Run AI Challenge**.

---

## 🏗️ Architecture

```
                                    +-----------------------------------------+
                                    |         React (Vite) Frontend           |
                                    | - Dual Mode: Sign In / Create Account   |
                                    | - One-Click Federated Google Sign-In    |
                                    | - Live Auth State & Token Context       |
                                    +--------------------+--------------------+
                                                         |
                                                         | Firebase Bearer ID Token
                                                         v
                                    +-----------------------------------------+
                                    |         Express.js Node Backend         |
                                    | - Firebase Admin SDK Token Verification |
                                    | - User Session & Role Provisioning      |
                                    | - REST API Gateway                      |
                                    +---------+--------------------+----------+
                                              |                    |
                                              | REST               | Internal HTTP
                                              v                    v
                            +-----------------------+    +-----------------------+
                            | MongoDB / Firestore   |    | Python FastAPI Micro  |
                            | User-Isolated Storage |    |  Vector Search & RAG  |
                            +-----------------------+    +-----------------------+
```

---

## 🚀 Quick Start (Running the Application)

### 1. View Frontend (Currently Running)
The React client is running live at:
👉 **[http://localhost:5173](http://localhost:5173)**

### 2. Connect Your Firebase Project
You have two easy options to connect the Firebase project you created:

#### Option A: Enter via Web Interface
1. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
2. Click the yellow **"Connect Project"** banner button.
3. Paste either your raw Firebase Web SDK snippet or enter your `Project ID` and `API Key`.
4. Click **Save & Initialize Firebase** (it auto-reloads and connects).

#### Option B: Configure via `.env`
In `client/.env`:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🔑 Firebase Console Configuration Checklist

In your Firebase Console (`https://console.firebase.google.com`):
1. **Enable Google Sign-In**:
   - Go to **Build** &rarr; **Authentication** &rarr; **Sign-in method**.
   - Enable **Google**.
   - Enable **Email/Password**.
2. **Authorized Domains**:
   - In Authentication &rarr; Settings &rarr; Authorized Domains, ensure `localhost` is listed (it is by default).

---

## 🧪 Testing Authentication Features

- **Google Sign-In**: Click **"Continue with Google"** to open the Google federated sign-in popup.
- **Email Registration**: Switch to **"Create Account"**, enter your name, email, and password.
- **Email Sign-In**: Switch to **"Sign In"** to authenticate.
- **Password Reset**: Click **"Forgot password?"** to receive a reset email.
- **Dashboard View**: After authentication, the app automatically transitions to the authenticated workspace displaying your verified profile, UID, and Firebase JWT bearer token.
