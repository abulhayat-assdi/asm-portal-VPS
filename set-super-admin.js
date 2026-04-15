/**
 * One-time script to set super_admin custom claims on the portal owner.
 * 
 * Usage:
 *   node set-super-admin.js
 * 
 * Prerequisites:
 *   - serviceAccountKey.json must exist in the project root, OR
 *   - FIREBASE_SERVICE_ACCOUNT env var must be set
 * 
 * After running this script, the portal owner must log out and log back in
 * for the new custom claims to take effect.
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// --- Configuration ---
const PORTAL_OWNER_EMAIL = "mohammadabulhayatt@gmail.com";
const NEW_ROLE = "super_admin";

// --- Initialize Firebase Admin ---
function initAdmin() {
    if (admin.apps.length) return;

    let serviceAccount;
    const envKey = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envKey) {
        serviceAccount = JSON.parse(envKey);
    } else {
        const keyPath = path.join(__dirname, 'serviceAccountKey.json');
        if (!fs.existsSync(keyPath)) {
            throw new Error(`serviceAccountKey.json not found at: ${keyPath}\nSet FIREBASE_SERVICE_ACCOUNT env var or place the key file in the project root.`);
        }
        serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

async function main() {
    initAdmin();

    const auth = admin.auth();
    const db = admin.firestore();

    console.log(`\n🔐 Setting super_admin claims for: ${PORTAL_OWNER_EMAIL}\n`);

    // 1. Find the user by email
    let userRecord;
    try {
        userRecord = await auth.getUserByEmail(PORTAL_OWNER_EMAIL);
        console.log(`✅ Found user: ${userRecord.uid} (${userRecord.email})`);
    } catch (err) {
        console.error(`❌ User not found: ${PORTAL_OWNER_EMAIL}`);
        console.error(err.message);
        process.exit(1);
    }

    // 2. Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
        role: NEW_ROLE,
        admin: true,
        super_admin: true,
    });
    console.log(`✅ Custom claims set: { role: "${NEW_ROLE}", admin: true, super_admin: true }`);

    // 3. Update Firestore users document
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
        await userDocRef.update({ role: NEW_ROLE });
        console.log(`✅ Firestore users/${userRecord.uid} role updated to "${NEW_ROLE}"`);
    } else {
        console.warn(`⚠️  No Firestore document found at users/${userRecord.uid}. Claims are set but Firestore role was not updated.`);
    }

    console.log(`\n✨ Done! The user must log out and log back in for changes to take effect.\n`);
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
