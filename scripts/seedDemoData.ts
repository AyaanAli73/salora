import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * Salora Salon Management System — Demo Seeder
 * OPTIONAL DEVELOPMENT/TESTING ONLY.
 * Never runs automatically in production.
 *
 * Usage: npm run seed:demo
 */

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
}

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error('❌ Error: Firebase credentials are missing in .env. Please set VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_API_KEY.')
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function seed() {
  console.log(`🌱 Seeding Salora demo data into project: ${firebaseConfig.projectId}...`)

  const now = serverTimestamp()

  // 1. Salon Master Profile (salon/main)
  console.log('Writing salon/main...')
  await setDoc(doc(db, 'salon', 'main'), {
    name: 'Salora Luxury Salon & Spa',
    legalName: 'Salora Wellness Private Limited',
    logoUrl: '/salora.png',
    phone: '+91 98201 44521',
    email: 'concierge@salora.in',
    address: '42, Palladium Luxury Boulevard, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    businessHours: {
      monday: { open: '10:00', close: '21:00', isOpen: true },
      tuesday: { open: '10:00', close: '21:00', isOpen: true },
      wednesday: { open: '10:00', close: '21:00', isOpen: true },
      thursday: { open: '10:00', close: '21:00', isOpen: true },
      friday: { open: '10:00', close: '21:00', isOpen: true },
      saturday: { open: '09:30', close: '21:30', isOpen: true },
      sunday: { open: '10:00', close: '20:30', isOpen: true },
    },
    createdAt: now,
    updatedAt: now,
  })

  // 2. Services Menu
  console.log('Writing services catalog...')
  const services = [
    { name: 'Precision Hair Cut & Style', category: 'Hair', duration: 45, price: 950, active: true },
    { name: 'Signature Keratin Luxe Infusion', category: 'Hair Treatment', duration: 90, price: 4200, active: true },
    { name: 'Moroccan Oil Hydration Hair Spa', category: 'Hair Spa', duration: 60, price: 1800, active: true },
    { name: 'Balayage Color & Gloss Ritual', category: 'Hair Color', duration: 120, price: 5500, active: true },
    { name: 'Japanese Glow Micro-Facial', category: 'Skin Care', duration: 60, price: 2400, active: true },
    { name: 'O3+ Diamond Brightening Radiance', category: 'Skin Care', duration: 75, price: 3200, active: true },
    { name: 'Classic Beard Sculpt & Hot Towel', category: 'Men Grooming', duration: 30, price: 500, active: true },
    { name: 'Deluxe Pedicure & Foot Reflexology', category: 'Nail & Hand Care', duration: 45, price: 1100, active: true },
  ]

  for (const s of services) {
    await addDoc(collection(db, 'services'), { ...s, createdAt: now, updatedAt: now })
  }

  // 3. Demo Clients
  console.log('Writing demo clients...')
  const clients = [
    { firstName: 'Priya', lastName: 'Sharma', fullName: 'Priya Sharma', phone: '+91 98113 90214', email: 'priya@example.com', vip: true, totalVisits: 14, totalSpent: 28400, status: 'active' },
    { firstName: 'Seraphina', lastName: 'Laurent', fullName: 'Seraphina Laurent', phone: '+91 98201 44521', email: 'seraphina@example.com', vip: true, totalVisits: 8, totalSpent: 34200, status: 'active' },
    { firstName: 'Julian', lastName: 'Mercer', fullName: 'Julian Mercer', phone: '+91 97112 88419', email: 'julian@example.com', vip: false, totalVisits: 4, totalSpent: 6200, status: 'active' },
    { firstName: 'Kavita', lastName: 'Menon', fullName: 'Kavita Menon', phone: '+91 98765 01234', email: 'kavita@example.com', vip: false, totalVisits: 1, totalSpent: 950, status: 'new' },
  ]

  for (const c of clients) {
    await addDoc(collection(db, 'clients'), { ...c, createdAt: now, updatedAt: now })
  }

  console.log('✅ Salora demo data successfully seeded into Cloud Firestore!')
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
