import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as bcrypt from 'bcryptjs'

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const auth = admin.auth()

// Helper: Normalize username
const normalizeUsername = (u: string): string => {
  return (u || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '')
}

// Helper: Get today's date in YYYY_MM_DD format for atomic daily counters
const getBusinessDateKey = (timezone = 'Asia/Kolkata'): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    return formatter.format(new Date()).replace(/-/g, '_')
  } catch {
    return new Date().toISOString().split('T')[0].replace(/-/g, '_')
  }
}

/**
 * Audit Log Helper
 */
const logAudit = async (
  actorUid: string,
  action: string,
  module: string,
  entityType: string,
  entityId: string,
  description: string,
  metadata: Record<string, any> = {}
) => {
  try {
    await db.collection('auditLogs').add({
      actorUid: actorUid || 'system',
      action,
      module,
      entityType,
      entityId,
      description,
      metadata,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
  } catch (err) {
    console.error('Audit log write error:', err)
  }
}

/**
 * 1. checkFirstRunStatus
 * Determines if the salon system has an initial owner account provisioned.
 */
export const checkFirstRunStatus = functions.https.onCall(async () => {
  try {
    const ownerSnapshot = await db
      .collection('users')
      .where('role', '==', 'owner')
      .where('active', '==', true)
      .limit(1)
      .get()

    const salonDoc = await db.collection('salon').doc('main').get()
    const salonName = salonDoc.exists ? salonDoc.data()?.name || 'Salora' : 'Salora'

    return {
      initialized: !ownerSnapshot.empty,
      salonName,
    }
  } catch (err) {
    console.error('checkFirstRunStatus error:', err)
    return { initialized: true, salonName: 'Salora' }
  }
})

/**
 * 2. setupInitialOwner
 * First-run owner account setup.
 * Strictly disallowed if an active owner account already exists.
 */
export const setupInitialOwner = functions.https.onCall(async (request) => {
  const data = request.data || {}
  const rawUsername = data.username
  const password = data.password
  const ownerName = (data.ownerName || 'Salon Owner').trim()
  const salonName = (data.salonName || 'Salora').trim()

  const normalized = normalizeUsername(rawUsername)

  if (!normalized || normalized.length < 3) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Username must be at least 3 characters and contain only letters, numbers, hyphens, or underscores.'
    )
  }

  if (!password || password.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters long.'
    )
  }

  // Guard: Check if an owner already exists
  const existingOwnerSnap = await db
    .collection('users')
    .where('role', '==', 'owner')
    .where('active', '==', true)
    .limit(1)
    .get()

  if (!existingOwnerSnap.empty) {
    throw new functions.https.HttpsError(
      'already-exists',
      'An owner account has already been set up for this salon. Please sign in.'
    )
  }

  // Hash password with bcrypt
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  // Create Firebase Auth user
  const emailPlaceholder = `${normalized}@salora.local`
  const fbUser = await auth.createUser({
    displayName: ownerName,
    email: emailPlaceholder,
    emailVerified: true,
  })

  // Set Firebase Custom Claims for Role Authorization
  await auth.setCustomUserClaims(fbUser.uid, {
    role: 'owner',
    username: normalized,
  })

  const now = admin.firestore.FieldValue.serverTimestamp()

  // Save backend-only credential in dedicated credentials collection (locked by security rules)
  await db.collection('credentials').doc(normalized).set({
    username: rawUsername,
    usernameNormalized: normalized,
    uid: fbUser.uid,
    passwordHash,
    active: true,
    createdAt: now,
  })

  // Save public user profile
  await db.collection('users').doc(fbUser.uid).set({
    displayName: ownerName,
    username: normalized,
    role: 'owner',
    active: true,
    avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
    createdAt: now,
    updatedAt: now,
  })

  // Store primary owner profile at owner/main
  await db.collection('owner').doc('main').set({
    name: ownerName,
    username: normalized,
    photoUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
    createdAt: now,
    updatedAt: now,
  })

  // Initialize salon/main with provided address & phone
  const salonRef = db.collection('salon').doc('main')
  await salonRef.set({
    name: salonName || 'Salora',
    legalName: salonName || 'Salora',
    logoUrl: '/salora.png',
    phone: data.salonPhone || '+91 98200 00000',
    email: 'contact@salora.in',
    address: data.salonAddress || 'Shop 4, Ground Floor, Luxury Arcade',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400050',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    createdAt: now,
    updatedAt: now,
  }, { merge: true })

  // Initialize required settings documents
  await db.collection('settings').doc('general').set({
    salonName: salonName || 'Salora',
    phone: data.salonPhone || '+91 98200 00000',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    updatedAt: now,
  }, { merge: true })

  await db.collection('settings').doc('booking').set({
    allowWalkIns: true,
    slotIntervalMinutes: 15,
    bufferTimeMinutes: 10,
    updatedAt: now,
  }, { merge: true })

  await db.collection('settings').doc('printing').set({
    receiptWidth: '80mm',
    autoPrintToken: true,
    autoPrintInvoice: false,
    updatedAt: now,
  }, { merge: true })

  await db.collection('settings').doc('notifications').set({
    smsEnabled: false,
    whatsappEnabled: false,
    emailEnabled: false,
    updatedAt: now,
  }, { merge: true })

  await db.collection('settings').doc('ai').set({
    enabled: true,
    allowDataAnalysis: true,
    updatedAt: now,
  }, { merge: true })

  await logAudit(
    fbUser.uid,
    'setup_owner',
    'auth',
    'user',
    fbUser.uid,
    `Initial owner account "${normalized}" created successfully.`
  )

  // Generate Custom Token for immediate client login
  const customToken = await auth.createCustomToken(fbUser.uid, {
    role: 'owner',
    username: normalized,
  })

  return {
    customToken,
    user: {
      uid: fbUser.uid,
      username: normalized,
      displayName: ownerName,
      role: 'owner',
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
    },
  }
})

/**
 * 3. loginWithUsername
 * Authenticates user via username and bcrypt password hash.
 * Issues a Firebase Custom Token upon successful verification.
 */
export const loginWithUsername = functions.https.onCall(async (request) => {
  const data = request.data || {}
  const rawUsername = data.username
  const password = data.password

  const normalized = normalizeUsername(rawUsername)

  if (!normalized || !password) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Please enter your username and password.'
    )
  }

  // Rate Limiting & Failed Attempt Tracking
  const attemptRef = db.collection('authAttempts').doc(normalized)
  const attemptSnap = await attemptRef.get()
  const attemptData = attemptSnap.data() || { count: 0, lastAttempt: 0 }

  const nowMs = Date.now()
  const fifteenMinutes = 15 * 60 * 1000

  if (attemptData.count >= 5 && nowMs - (attemptData.lastAttempt || 0) < fifteenMinutes) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Too many failed login attempts. Please wait 15 minutes before trying again.'
    )
  }

  // Lookup Credential
  const credSnap = await db.collection('credentials').doc(normalized).get()

  if (!credSnap.exists) {
    await attemptRef.set({
      count: (attemptData.count || 0) + 1,
      lastAttempt: nowMs,
    })
    // Generic error to prevent username enumeration
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Invalid username or password.'
    )
  }

  const cred = credSnap.data()!

  if (!cred.active) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This salon staff account has been deactivated. Please contact the salon owner.'
    )
  }

  // Verify bcrypt password hash
  const isValid = await bcrypt.compare(password, cred.passwordHash)

  if (!isValid) {
    await attemptRef.set({
      count: (attemptData.count || 0) + 1,
      lastAttempt: nowMs,
    })
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Invalid username or password.'
    )
  }

  // Clear failed attempt counter upon success
  await attemptRef.delete()

  // Fetch User Profile
  const userSnap = await db.collection('users').doc(cred.uid).get()
  const userData = userSnap.data() || {}

  const role = userData.role || 'staff'
  const displayName = userData.displayName || rawUsername

  // Mint Firebase Custom Token with claims
  const customToken = await auth.createCustomToken(cred.uid, {
    role,
    username: normalized,
  })

  await logAudit(
    cred.uid,
    'login',
    'auth',
    'user',
    cred.uid,
    `Staff user "${normalized}" (${role}) signed in successfully.`
  )

  return {
    customToken,
    user: {
      uid: cred.uid,
      username: normalized,
      displayName,
      role,
      avatarUrl: userData.avatarUrl,
    },
  }
})

/**
 * 4. createStaffUser
 * Admin/Owner creation of staff accounts.
 */
export const createStaffUser = functions.https.onCall(async (request) => {
  // Enforce caller authorization: must be signed in as Owner or Admin
  if (!request.auth || !request.auth.token) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.')
  }

  const callerRole = request.auth.token.role
  if (callerRole !== 'owner' && callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the Salon Owner or Administrator can create staff accounts.'
    )
  }

  const data = request.data || {}
  const rawUsername = data.username
  const password = data.password
  const name = (data.name || '').trim()
  const role = data.role || 'staff'
  const phone = data.phone || ''
  const specialties = data.specialties || []

  const normalized = normalizeUsername(rawUsername)

  if (!normalized || normalized.length < 3) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Username must be at least 3 characters and alphanumeric.'
    )
  }

  if (!password || password.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters long.'
    )
  }

  if (!name) {
    throw new functions.https.HttpsError('invalid-argument', 'Staff name is required.')
  }

  // Check username uniqueness
  const existingCredSnap = await db.collection('credentials').doc(normalized).get()
  if (existingCredSnap.exists) {
    throw new functions.https.HttpsError(
      'already-exists',
      `Username "${normalized}" is already taken. Please choose another username.`
    )
  }

  // Hash password
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  // Create Firebase Auth user
  const emailPlaceholder = `${normalized}@salora.local`
  const fbUser = await auth.createUser({
    displayName: name,
    email: emailPlaceholder,
    emailVerified: true,
  })

  // Custom Claims
  await auth.setCustomUserClaims(fbUser.uid, {
    role,
    username: normalized,
  })

  const now = admin.firestore.FieldValue.serverTimestamp()

  // Save credential
  await db.collection('credentials').doc(normalized).set({
    username: rawUsername,
    usernameNormalized: normalized,
    uid: fbUser.uid,
    passwordHash,
    active: true,
    createdAt: now,
  })

  // Save user profile
  await db.collection('users').doc(fbUser.uid).set({
    displayName: name,
    username: normalized,
    role,
    active: true,
    phone,
    avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
    createdAt: now,
    updatedAt: now,
  })

  // Create corresponding staff record in staff collection
  const staffRef = await db.collection('staff').add({
    userId: fbUser.uid,
    name,
    username: normalized,
    phone,
    role,
    specialties,
    status: 'active',
    joiningDate: new Date().toISOString().split('T')[0],
    createdAt: now,
    updatedAt: now,
  })

  await logAudit(
    request.auth.uid,
    'create_staff',
    'staff',
    'staff',
    staffRef.id,
    `Created new staff account "${normalized}" with role "${role}".`
  )

  return {
    uid: fbUser.uid,
    username: normalized,
    staffId: staffRef.id,
  }
})

/**
 * 5. changeStaffPassword
 * Changes a staff member's password securely on server.
 */
export const changeStaffPassword = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.')
  }

  const { targetUid, newPassword } = request.data || {}
  const callerUid = request.auth.uid
  const callerRole = request.auth.token.role

  if (!newPassword || newPassword.length < 6) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Password must be at least 6 characters long.'
    )
  }

  // Caller must be Owner/Admin OR changing their own password
  if (callerUid !== targetUid && callerRole !== 'owner' && callerRole !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to reset another user\'s password.'
    )
  }

  // Find target credential by UID
  const credQuery = await db
    .collection('credentials')
    .where('uid', '==', targetUid)
    .limit(1)
    .get()

  if (credQuery.empty) {
    throw new functions.https.HttpsError('not-found', 'User credentials not found.')
  }

  const credDoc = credQuery.docs[0]
  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(newPassword, salt)

  await credDoc.ref.update({
    passwordHash,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  // Revoke refresh tokens to force re-authentication if reset by admin
  await auth.revokeRefreshTokens(targetUid)

  await logAudit(
    callerUid,
    'change_password',
    'auth',
    'user',
    targetUid,
    `Password was updated for user ${targetUid}.`
  )

  return { success: true }
})

/**
 * 6. generateDailyToken
 * Atomic daily queue token generator.
 * Counter resets daily per business date.
 * Guarantees zero duplicate token numbers even under simultaneous receptionist check-ins.
 */
export const generateDailyToken = functions.https.onCall(async (request) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.')
  }

  const data = request.data || {}
  const { appointmentId, clientId, serviceId, staffId, priority } = data

  const dateKey = getBusinessDateKey()
  const counterRef = db.collection('counters').doc(`dailyToken_${dateKey}`)

  const result = await db.runTransaction(async (transaction) => {
    const counterSnap = await transaction.get(counterRef)
    let nextCount = 1

    if (counterSnap.exists) {
      nextCount = (counterSnap.data()?.lastNumber || 0) + 1
    }

    transaction.set(
      counterRef,
      {
        lastNumber: nextCount,
        businessDate: dateKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    // Formats: 1 -> #001, 27 -> #027, 105 -> #105
    const formattedTokenNumber = `#${String(nextCount).padStart(3, '0')}`
    const displayId = `TK-${nextCount}`

    // Create Token document
    const tokenRef = db.collection('tokens').doc()
    const now = admin.firestore.FieldValue.serverTimestamp()

    const tokenDoc = {
      tokenNumber: formattedTokenNumber,
      displayId,
      number: nextCount,
      businessDate: dateKey,
      appointmentId: appointmentId || null,
      clientId: clientId || null,
      serviceId: serviceId || null,
      staffId: staffId || null,
      status: 'WAITING',
      priority: Boolean(priority),
      createdAt: now,
      checkedInAt: now,
    }

    transaction.set(tokenRef, tokenDoc)

    // If linked to an appointment, update appointment status to CHECKED_IN
    if (appointmentId) {
      const apptRef = db.collection('appointments').doc(appointmentId)
      transaction.update(apptRef, {
        status: 'CHECKED_IN',
        tokenId: tokenRef.id,
        tokenNumber: formattedTokenNumber,
        updatedAt: now,
      })
    }

    return {
      tokenId: tokenRef.id,
      tokenNumber: formattedTokenNumber,
      displayId,
    }
  })

  await logAudit(
    request.auth.uid,
    'generate_token',
    'queue',
    'token',
    result.tokenId,
    `Issued queue token ${result.tokenNumber} for client ${clientId || 'walk-in'}.`
  )

  return result
})

/**
 * 7. exportSalonData
 * Admin/Owner only. Exports authorized dataset as JSON.
 */
export const exportSalonData = functions.https.onCall(async (request) => {
  if (!request.auth || !request.auth.token) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.')
  }

  const role = request.auth.token.role
  if (role !== 'owner' && role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only the Salon Owner or Administrator can export business data.'
    )
  }

  const moduleName = request.data?.module || 'all'
  const exportable = ['clients', 'appointments', 'bills', 'payments', 'inventory', 'expenses']

  const exportData: Record<string, any[]> = {}

  for (const col of exportable) {
    if (moduleName === 'all' || moduleName === col) {
      const snap = await db.collection(col).limit(1000).get()
      exportData[col] = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    }
  }

  await logAudit(
    request.auth.uid,
    'export_data',
    'system',
    'data_export',
    moduleName,
    `Exported dataset for module: ${moduleName}.`
  )

  return {
    module: moduleName,
    exportedAt: new Date().toISOString(),
    recordCounts: Object.fromEntries(
      Object.entries(exportData).map(([k, v]) => [k, v.length])
    ),
    data: exportData,
  }
})
