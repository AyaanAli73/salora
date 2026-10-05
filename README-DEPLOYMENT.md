# SALORA — Production Deployment Guide

This document describes how to deploy the production build of **Salora Salon Management System** to production hosting.

---

## 1. Prerequisites

- Node.js version 20+ installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Configured `.env` file containing your production Firebase project keys

---

## 2. Production Build

Build the optimized React + Vite client bundle:

```bash
npm run build
```

This compiles TypeScript (`tsc -b`) and generates the minified static production assets into `dist/`.

---

## 3. Option A: Deploy to Firebase Hosting (Recommended)

Firebase Hosting serves your Salora single-page application with global CDN caching, custom SSL, and seamless integration with Cloud Functions and Firestore.

1. Ensure `firebase.json` has the hosting configuration:
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

2. Build and deploy:
```bash
npm run build
firebase deploy --only hosting,firestore,storage,functions
```

3. Connect your custom domain in the Firebase Console:
   - Go to **Hosting > Custom domain**
   - Enter your domain (e.g. `desk.mysalon.com` or `salora.salonname.com`)
   - Add the verified DNS A-records provided by Google.

---

## 4. Option B: Deploy to Vercel

If you host the frontend on Vercel:

1. Import your repository into Vercel.
2. In **Environment Variables**, add:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_FUNCTIONS_REGION`
3. Deploy.
4. Deploy your Firebase backend rules and functions separately via Firebase CLI:
```bash
firebase deploy --only firestore,storage,functions
```

---

## 5. Post-Deployment Checklist

- [ ] Firebase Security Rules deployed and active
- [ ] Firestore Composite Indexes built
- [ ] First-run owner account registered (`/login`)
- [ ] Staff accounts provisioned by owner under Staff module
- [ ] Services menu populated with salon rituals and pricing
- [ ] Cloud Functions regional latency verified (`asia-south1` or primary market region)
- [ ] PWA installed on salon reception iPad / tablet / workstation
