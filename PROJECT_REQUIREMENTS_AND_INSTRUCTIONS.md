# Master Project Instructions & Requirements Specification
**Program**: Google Cloud Gen AI Academy APAC Edition — Cohort 3 Ideathon  
**Challenge**: Google Cloud Run AI Challenge (`cloud-run-ai-challenge#0`)  
**Project**: Personal Gemini Journal (Production MERN Edition)  
**Submission Deadline**: **6 September 2026, 11:59 PM IST** (Portal Locks)  
**Mandatory Hashtag**: `#AccelerateAIwithCloudRun`  
**Mandatory Cloud Run Label**: `dev-tutorial=cloud-run-ai-challenge`

---

## 1. Executive Summary & Challenge Mandate

According to the official **Gen AI Academy APAC Edition** communication and the **Google Developers Cloud Run AI Challenge Codelab**, submissions must be:
> *"A production-ready, authenticated AI application deployed on Cloud Run using Firebase Authentication, Firestore, and the Gemini API in AI Studio."*

---

## 2. Core Technology Stack & Architecture (Strict MERN)

| Component | Technology | Purpose & Implementation Rule |
| :--- | :--- | :--- |
| **Frontend (R)** | **React 19 + Vite** | Single Page Application with Material 3 Glassmorphic UI, responsive layouts, voice dictation, and real-time state management. |
| **Backend (E & N)** | **Node.js + Express** | Secure API gateway, handling token verification, Firestore ABAC persistence, and Gemini SDK orchestration. |
| **User Identity** | **Firebase Authentication** | Secure login exclusively via **Google Sign-In** (OAuth 2.0). Direct storage of passwords is prohibited per Codelab Directive 2; client receives and passes Firebase JWT bearer tokens. |
| **Database (M)** | **Cloud Firestore** | Document database implementing strict **Attribute-Based Access Control (ABAC)** under `/users/{userId}/interactions/{interactionId}`. Undefined values must be stripped prior to database calls. |
| **AI Engine (G)** | **Google Gemini API** (`@google/genai`) | Multi-turn conversational journaling engine utilizing a resilient 4-tier model ladder (`gemini-2.5-flash` → `gemini-3.6-flash` → `gemini-2.0-flash` → `gemini-1.5-flash`). |
| **Secret Management** | **Secret Manager / `.env`** | Gemini API keys and Firebase service credentials must remain strictly backend-side; never exposed to browser bundles. |
| **Deployment** | **Google Cloud Run** | Multi-stage Docker container deployed as an autoscaling serverless service. |

---

## 3. Detailed Functional Requirements & User Flow

The application must implement the end-to-end user journey defined in **Codelab Step 2 ("Personal Gemini Journal")**:

### 1. Landing & Authentication Flow
- User arrives at the app and is greeted by an authentication interface.
- Must support pure **Google Sign-In** (OAuth 2.0 popup/redirect) with zero direct password storage.
- Unauthenticated users cannot access private journal reflections or API endpoints.

### 2. Private Conversational Dashboard
- Once authenticated, user enters their private workspace displaying their user profile, UID, and session token.
- User can title their journal entries, select their current emotional **Mindset / Mood** (*Reflective*, *Energized*, *Analytical*, *Thoughtful*, *Vulnerable*, *Focused*), and specify location/context.

### 3. Multi-Turn Gemini AI Interaction
- **Conversational Memory**: The journal must maintain full multi-turn conversation history (`history: [{ role: 'user' | 'model', content }]`).
- **Empathetic Reflections**: Gemini synthesizes the user's thoughts into:
  - **Synthesis**: Core conceptual reflection adapting to the user's emotional state.
  - **Key Takeaways**: Actionable insights and blind-spot identification.
  - **Actionable Next Steps**: Structured check-list milestones.
  - **Reflective Question**: Engaging follow-up question prompting the next conversational turn.
- **Voice Dictation**: Hands-free verbal journaling using the browser Web Speech API.

### 4. User-Isolated Persistence (Directive 3 & 6)
- Every conversational interaction (prompts, model responses, mood, timestamp, turn count) must be saved into **Cloud Firestore**.
- **Data Isolation**: Documents must be stored strictly under:
  ```text
  /users/{userId}/interactions/{interactionId}
  ```
  Users must never be able to access, read, or modify another user's journal entries.
- **Undefined Stripping**: The application must sanitize and strip all `undefined` values before executing any Firestore transaction to prevent database write rejections.

### 5. Journal Vault & History Review
- The user must be able to view a chronological history of their past entries.
- Clicking an entry restores the conversation into the studio.
- Owner-verified deletion capability to remove entries.

---

## 4. Disqualification Warning: Required Verification Label

> [!CAUTION]
> ### Cloud Run Automated Scoring Label
> When deploying the Cloud Run service, you **MUST** attach the following label. Without it, Google's automated grading system will fail to track and score your deployment:
> - **Key**: `dev-tutorial`
> - **Value**: `cloud-run-ai-challenge`

---

## 5. Mandatory 4-Item Submission Checklist

Before the portal locks on **6 September, 11:59 PM IST**, all four assets must be submitted on the Hack2Skill Ideathon dashboard:

### 1. Live Cloud Run URL
- A working public HTTPS URL of your deployed application on Cloud Run (e.g., `https://personal-gemini-journal-xxxx-xx.a.run.app`).

### 2. Public Code Repository Link
- A public GitHub or GitLab repository containing:
  - Frontend source code (`client/`)
  - Backend source code (`server/`)
  - Production `Dockerfile`
  - `README.md` with architectural description, features, setup guide, and Firestore security rules.

### 3. Social Media Demo Post Link
- A public post on **LinkedIn, X, Facebook, Medium, or YouTube**.
- Must include a video screen recording or blog post walkthrough showing users authenticating, chatting with Gemini, and saving to Firestore.
- **Mandatory Hashtag**: `#AccelerateAIwithCloudRun`

### 4. Dashboard Submission Form
- Complete all mandatory fields under the **Ideathon Prototype Submission** tab on the Hack2Skill participant portal.

---

## 6. Official Evaluation & Scoring Matrix

| Criterion | Weight / Focus | What Evaluators Look For |
| :--- | :--- | :--- |
| **Authenticity** | High | Originality of implementation. Did you extend beyond the baseline starter? *(e.g., Mindset pills, voice dictation, resilient 4-tier model ladder, dual-store sync, glassmorphism UI).* |
| **Usability** | High | Fluid authentication, zero UI glitches, intuitive conversation flow, responsive design on mobile and desktop. |
| **Stability** | High | Robust error recovery. The 4-tier fallback ladder gracefully recovers from `503`, `429`, `404`, and `500` errors without breaking user sessions. |
| **Security** | High | ABAC user isolation on Firestore (`/users/{userId}/interactions/{interactionId}`), API keys secured backend-side, Bearer token verification. |

---

## 7. Database Security Rules Specification

### Cloud Firestore Rules (Attribute-Based Access Control)
Go to **Firebase Console > Firestore Database > Rules** and publish:

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

### Firebase Realtime Database Rules (JSON Syntax)
If using Realtime Database under **Realtime Database > Rules**:

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

## 8. Quick Commands Reference

### Running Locally
```bash
# 1. Start React Frontend (Port 5173)
npm --prefix client run dev

# 2. Start Express Backend (Port 5000)
node server/server.js
```

### Building for Production
```bash
npm --prefix client run build
```

### Deploying to Cloud Run via gcloud CLI
```bash
gcloud run deploy personal-gemini-journal \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-labels dev-tutorial=cloud-run-ai-challenge \
  --set-env-vars GEMINI_API_KEY="YOUR_KEY",FIREBASE_PROJECT_ID="cohort3-29812"
```
