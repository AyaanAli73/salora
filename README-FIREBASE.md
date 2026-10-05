# SALORA — Firebase Production Setup & Integration Guide

This guide walks you through connecting your **Salora Salon Management System** to a production **Google Firebase** project.

Salora is built specifically as a **single-salon, single-location** system without multi-tenant overhead or third-party dependencies.

---

## Architecture Overview

```
                                  ┌──────────────────────────────┐
                                  │   Salora Web Terminal (PWA)  │
                                  └──────────────┬───────────────┘
                                                 │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   ▼                             ▼                             ▼
       ┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
       │ Firebase Auth        │      │ Cloud Firestore      │      │ Cloud Storage        │
       │ (Custom Token Flow)  │      │ (Single-Salon Data)  │      │ (Avatars & Receipts) │
       └──────────▲───────────┘      └──────────▲───────────┘      └──────────────────────┘
                  │                             │
                  │   ┌─────────────────────────┴─────────┐
                  └───┤ Firebase Cloud Functions          │
                      │ (Username Auth, Atomic Counters,  │
                      │  Staff Provisioning, Audit Logs)  │
                      └───────────────────────────────────┘
```

---

## 1. Create Firebase Project

1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g. `salora-salon-mumbai`).
3. Choose whether to enable Google Analytics, then click **Create Project**.

---

## 2. Register Web App & Collect Keys

1. In the Project Overview page, click the **Web icon (`</>`)** to add an app.
2. App nickname: `Salora Salon Desk`.
3. Uncheck Firebase Hosting for now (or enable if deploying to Firebase Hosting).
4. Copy the `firebaseConfig` properties and paste them into your `.env` file:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=salora-salon-mumbai.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=salora-salon-mumbai
VITE_FIREBASE_STORAGE_BUCKET=salora-salon-mumbai.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_FUNCTIONS_REGION=asia-south1
```

---

## 3. Enable Cloud Firestore

1. In the Firebase console sidebar, navigate to **Build > Firestore Database**.
2. Click **Create Database**.
3. Choose your database location (Recommended: `asia-south1` for Indian salons or your closest region).
4. Start in **Production mode**.
5. Deploy the provided `firestore.rules` and `firestore.indexes.json`:

```bash
firebase deploy --only firestore
```

---

## 4. Enable Firebase Authentication

1. In the Firebase console sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, ensure Authentication is enabled.
4. *Note on Salora Auth:* Salora uses a secure **Username + Password** custom authentication architecture. Staff and receptionists log in using only their Username and Password without requiring an email address or third-party social login.

---

## 5. Enable Cloud Storage

1. Navigate to **Build > Storage**.
2. Click **Get Started** in Production mode.
3. Choose your storage location.
4. Deploy the provided `storage.rules`:

```bash
firebase deploy --only storage
```

---

## 6. Deploy Cloud Functions

The `functions/` directory contains trusted backend endpoints for username verification, bcrypt password hashing, and atomic daily queue counters.

1. Install Firebase CLI globally if not already installed:
```bash
npm install -g firebase-tools
```
2. Log in to your Firebase account:
```bash
firebase login
```
3. Link your project:
```bash
firebase use --add
```
4. Install function dependencies and deploy:
```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

---

## 7. First-Run Owner Initialization

When you launch Salora with your Firebase credentials configured:

1. Open `http://localhost:5173/login`.
2. Salora will detect that no salon owner exists yet and show:
   **"Set up your Salora account"**.
3. Enter:
   - **Username** (e.g. `owner` or `salonadmin`)
   - **Password** (min 6 characters)
   - **Owner Name** (e.g. `Ayaan Khan`)
   - **Salon Name** (e.g. `Salora Luxury Studio`)
4. Click **Complete Initial Setup**.
5. This securely writes the bcrypt credential in the backend, creates the `salon/main` master document, sets custom claims, and signs you in.

---

## 8. Firestore Collections Reference

All business data is stored under these clean, single-salon collections:

| Collection | Purpose | Realtime Listener |
| :--- | :--- | :---: |
| `salon` | Master salon document (`salon/main`) | Yes |
| `users` | Public user profiles (`users/{uid}`) | Yes |
| `credentials` | Server-only bcrypt hashes (locked from client) | Cloud Function only |
| `clients` | Client CRM, contact info, VIP status, visit history | Yes |
| `appointments` | Scheduled treatments, timings, status | Yes |
| `tokens` | Daily live walk-in queue tokens | Yes |
| `services` | Service menu, prices, durations, categories | Yes |
| `staff` | Staff directory, schedules, specialties | Yes |
| `bills` | Ticket billing summaries, tax, discounts | Yes |
| `payments` | Split payments (Cash, UPI, Card) | Yes |
| `invoices` | Official printed invoices | No |
| `products` | Retail & backbar inventory catalog | Yes |
| `inventoryMovements` | Stock audit ledger (additions, deductions, sales) | No |
| `expenses` | Operating expenses and overheads | No |
| `attendance` | Staff check-in / check-out records | Yes |
| `leaveRequests` | Staff leave management | Yes |
| `payroll` | Staff commissions and salary statements | No |
| `memberships` | Client club memberships | No |
| `packages` | Pre-purchased service bundles | No |
| `rewards` | Loyalty tiers and redeemable perks | No |
| `loyaltyTransactions` | Points ledger (earned, redeemed) | No |
| `reviews` | Guest feedback and ratings | No |
| `notifications` | Live salon staff alerts | Yes |
| `auditLogs` | Immutable security audit trail | No |
| `settings` | Salon configuration documents | Yes |
| `counters` | Daily atomic token counters | Cloud Function only |

---

## 9. Security Principles

1. **Default Deny:** `firestore.rules` enforces default deny on all collections.
2. **Role-based Access:** Rules check custom claims (`isOwner()`, `isAdmin()`, `isManager()`, `isReceptionist()`, `isStaff()`).
3. **No Client-Side Secrets:** Service account private keys are never included in the frontend bundle.
4. **No Plaintext Passwords:** Passwords are never sent to Firestore or stored in localStorage.
