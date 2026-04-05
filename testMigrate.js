const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf-8'));
if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

/**
 * Extract the storage path from a Firebase Storage URL
 * e.g. "...googleapis.com/v0/b/.../o/images%2Fblog%2Ffile.webp?alt=media..."
 * → "images/blog/file.webp"
 */
function extractStoragePath(url) {
    try {
        const match = url.match(/\/o\/(.+?)(\?|$)/);
        if (match) {
            return decodeURIComponent(match[1]);
        }
    } catch(e) {}
    return null;
}

/**
 * Convert a Firebase Storage path to the cPanel local /api/file URL
 * Firebase path: "images/blog/file.webp" 
 * → Local path: "public/images/blog/file.webp"
 * → URL: "/api/file?path=public%2Fimages%2Fblog%2Ffile.webp"
 */
function convertToLocalUrl(firebasePath) {
    // Map firebase storage folders to our public/private structure
    let localPath;
    if (firebasePath.startsWith('homework/')) {
        localPath = `private/${firebasePath}`;
    } else {
        // Everything else (images, resources, module_resources, etc) → public
        localPath = `public/${firebasePath}`;
    }
    return `/api/file?path=${encodeURIComponent(localPath)}`;
}

/**
 * Process a single field value - if it's a Firebase URL, convert it
 */
function convertFieldIfFirebase(value) {
    if (typeof value === 'string' && value.includes('firebasestorage.googleapis.com')) {
        const storagePath = extractStoragePath(value);
        if (storagePath) {
            return convertToLocalUrl(storagePath);
        }
    }
    return null; // No change
}

async function migrateCollection(collectionName, fields) {
    console.log(`\n📦 Migrating: ${collectionName}...`);
    const snap = await db.collection(collectionName).get();
    let count = 0;

    for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const updates = {};

        for (const field of fields) {
            const value = data[field];
            if (!value) continue;

            const newVal = convertFieldIfFirebase(value);
            if (newVal) {
                updates[field] = newVal;
            }
        }

        if (Object.keys(updates).length > 0) {
            await docSnap.ref.update(updates);
            console.log(`  ✅ Updated doc ${docSnap.id}: ${JSON.stringify(updates)}`);
            count++;
        }
    }

    console.log(`  → ${count} documents updated in '${collectionName}'`);
    return count;
}

async function runFullMigration() {
    console.log('🚀 Starting full Firebase Storage → Local Storage migration...\n');
    let total = 0;

    // Migrate all collections and their image/file fields
    total += await migrateCollection('posts', ['featuredImage', 'featuredImageUrl']);
    total += await migrateCollection('resources', ['fileUrl']);
    total += await migrateCollection('module_resources', ['fileUrl']);
    total += await migrateCollection('homework_submissions', ['fileUrl']);
    total += await migrateCollection('instructors', ['photoUrl', 'imageUrl', 'photo', 'profileImage']);
    total += await migrateCollection('successReviews', ['imageUrl', 'photoUrl', 'image']);
    total += await migrateCollection('successVideos', ['thumbnailUrl', 'videoUrl', 'imageUrl']);
    total += await migrateCollection('teachers', ['photoUrl', 'imageUrl', 'photo']);
    total += await migrateCollection('classes', ['imageUrl', 'coverImage']);

    console.log(`\n🎉 Migration complete! Total updated: ${total} documents`);
}

runFullMigration().catch(console.error);
