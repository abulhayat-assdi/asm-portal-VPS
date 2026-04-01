import * as admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let _adminDb: admin.firestore.Firestore | null = null;
let _adminAuth: admin.auth.Auth | null = null;

function getAdminServices() {
    if (_adminDb && _adminAuth) {
        return { adminDb: _adminDb, adminAuth: _adminAuth };
    }

    if (!admin.apps.length) {
        try {
            let serviceAccount;
            const envKey = process.env.FIREBASE_SERVICE_ACCOUNT;
            if (envKey) {
                serviceAccount = JSON.parse(envKey);
            } else {
                const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
                if (!fs.existsSync(keyPath)) {
                    throw new Error(`serviceAccountKey.json not found at: ${keyPath} and FIREBASE_SERVICE_ACCOUNT env var not set.`);
                }
                serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        } catch (error) {
            console.error("Firebase Admin initialization error:", error);
            throw error;
        }
    }

    _adminDb = admin.firestore();
    _adminAuth = admin.auth();
    return { adminDb: _adminDb, adminAuth: _adminAuth };
}

export { getAdminServices };
