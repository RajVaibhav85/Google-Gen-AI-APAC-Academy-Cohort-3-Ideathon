# Personal Gemini Journal (Production MERN Edition)

[![Google Cloud Run](https://img.shields.io/badge/Google%20Cloud-Run-4285F4?logo=googlecloud&logoColor=white)](https://cloud.google.com/run)
[![Google Gemini API](https://img.shields.io/badge/Google-Gemini%20API-9B72CF?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Firebase Authentication](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

A production-ready, authenticated AI journaling web application built strictly on the **MERN (MongoDB/Firestore, Express, React, Node.js)** stack for the **Google Cloud Gen AI Academy APAC Edition — Cohort 3 Ideathon** and **Google Cloud Run AI Challenge** (`cloud-run-ai-challenge#0`).

---

## 🏗️ Architecture & Technology Stack

```
                               +-------------------------------------------------+
                               |           React 19 + Vite Studio SPA            |
                               | - Studio Rail + Floating Omnibar Dock           |
                               | - Federated Google Sign-In (OAuth 2.0)          |
                               | - Multi-Theme (Obsidian, Slate, Violet)         |
                               | - Web Speech API Voice Dictation                |
                               +------------------------+------------------------+
                                                        |
                                                        | Bearer JWT Token
                                                        v
                               +-------------------------------------------------+
                               |           Express.js API Gateway (Node 20)       |
                               | - Firebase Admin SDK Token Verification         |
                               | - Query Guardrails (Journaling Focus Only)      |
                               | - 4-Tier Model Fallback Ladder Orchestration    |
                               +------------+-----------------------+------------+
                                            |                       |
                                            | ABAC /users/{uid}/... | Multi-Turn
                                            v                       v
                      +-----------------------------+     +-------------------------------+
                      |       Cloud Firestore       |     |     Google Gemini 2.5 Flash   |
                      | User-Isolated Interactions  |     |   Fallback: gemini-3.6-flash  |
                      | Realtime DB Secondary Sync  |     |   Library: @google/genai      |
                      +-----------------------------+     +-------------------------------+
```

### Core Stack Components:
- **Frontend**: React 19 + Vite single page application with modern Studio Rail navigation, Ambient Aurora mesh, bottom-pinned Omnibar dock, and animated skeleton loaders.
- **Backend**: Node.js + Express REST API gateway serving production assets and verifying Google OAuth JWT tokens via Firebase Admin.
- **User Authentication**: Pure **Google Sign-In** (OAuth 2.0). Zero direct password storage per Codelab Directive 2.
- **Data Persistence**: **Cloud Firestore** implementing strict Attribute-Based Access Control (ABAC) under `/users/{userId}/interactions/{interactionId}` with automatic `undefined`-stripping.
- **AI Engine**: Google Gemini API via `@google/genai` utilizing a resilient 4-tier model ladder (`gemini-2.5-flash` → `gemini-3.6-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`).
- **Query Guardrail System**: Filters arithmetic/math prompts (e.g. `2+2`), generic trivia, and off-topic coding queries, keeping the AI focused on personal reflection.

---

## 🌟 Key Features

1. **Pure Google Sign-In**: Seamless one-click OAuth 2.0 authentication with avatar rendering and session persistence.
2. **Interactive Journal Studio**:
   - Multi-turn conversational context retention (`history: [{ role, content }]`).
   - Mindset & Emotional State selector (*Reflective*, *Energized*, *Analytical*, *Thoughtful*, *Vulnerable*, *Focused*).
   - Structured AI reflection outputs: Synthesis, Key Takeaways, Actionable Next Steps, and Reflective Question.
3. **Hands-Free Voice Dictation**: Integrated Web Speech API microphone dictation.
4. **Cloud Firestore Vault**:
   - Full persistence and retrieval of historical reflections.
   - Search filter by mindset, title, and keywords.
   - Restore past entries into the studio or delete entries.
5. **Multiple Themes & Layouts**:
   - **Themes**: *Obsidian Aurora*, *Deep Slate*, and *Cosmic Violet* (all preserving the Google GenAI brand palette: `#4285F4`, `#9B72CF`, `#D96570`, `#24C6DC`).
   - **Layouts**: *Studio Workspace*, *Split Editor*, and *Zen Focus*.
6. **Prominent Loading States**: Visible splash screen on refresh, saving status indicators, and shimmer skeleton thinking cards.

---

## 🔒 Security & Firestore Rules Specification

### Cloud Firestore Security Rules
In **Firebase Console > Firestore Database > Rules**, publish:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Realtime Database Security Rules
In **Firebase Console > Realtime Database > Rules**:

```json
{
  "rules": {
    "users": {
      "$userId": {
        "interactions": {
          ".read": "auth != null && auth.uid === $userId",
          ".write": "auth != null && auth.uid === $userId"
        }
      }
    }
  }
}
```

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js 20+
- A Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)
- A Firebase project with Google Sign-In and Firestore enabled

### 2. Configure Environment Variables
Create a `.env` file in the root:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 3. Install & Run
```bash
# Start React frontend (Port 5173)
npm --prefix client run dev

# Start Express backend (Port 5000)
node server/server.js
```

---

## 🚢 Production Deployment to Google Cloud Run

### Automated Scoring Label
> [!IMPORTANT]
> When deploying to Cloud Run, the service **MUST** have the `dev-tutorial=cloud-run-ai-challenge` label attached for automated scoring and verification.

### Option 1: Deploy with gcloud CLI
```bash
# Build and deploy directly to Cloud Run
gcloud run deploy personal-gemini-journal \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-labels dev-tutorial=cloud-run-ai-challenge \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY",FIREBASE_PROJECT_ID="your-project-id"
```

### Option 2: Build & Push Container Image
```bash
# 1. Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/personal-gemini-journal .

# 2. Push to Google Container Registry or Artifact Registry
docker push gcr.io/YOUR_PROJECT_ID/personal-gemini-journal

# 3. Deploy to Cloud Run
gcloud run deploy personal-gemini-journal \
  --image gcr.io/YOUR_PROJECT_ID/personal-gemini-journal \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-labels dev-tutorial=cloud-run-ai-challenge \
  --set-env-vars GEMINI_API_KEY="YOUR_GEMINI_API_KEY",FIREBASE_PROJECT_ID="your-project-id"
```

---

## 📋 Hack2Skill Submission Checklist

- [x] **Strict MERN Stack Architecture**: React 19, Express, Node.js, Cloud Firestore (Python completely eliminated).
- [x] **Authentication**: Pure Google Sign-In with OAuth 2.0 and Bearer tokens.
- [x] **User-Isolated Storage**: Attribute-Based Access Control under `/users/{userId}/interactions/{interactionId}`.
- [x] **Gemini Intelligence**: Multi-turn dialogue with 4-tier model fallback (`gemini-2.5-flash` primary).
- [x] **Query Guardrails**: Declines arithmetic calculations (like `2+2`), trivia, and raw coding requests to maintain journaling focus.
- [x] **Cloud Run Verification Label**: `dev-tutorial=cloud-run-ai-challenge`.
- [x] **Mandatory Hashtag**: `#AccelerateAIwithCloudRun` for demo video / social post.
- [x] **Deadline**: 6 September 2026, 11:59 PM IST.
