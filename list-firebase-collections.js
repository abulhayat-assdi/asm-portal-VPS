const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccount = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'serviceAccountKey.json'), 'utf-8')
);
if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function main() {
  console.log('📋 Firebase Firestore — সব collections এবং document count:\n');
  const collections = await db.listCollections();

  for (const col of collections) {
    const snap = await col.get();
    console.log(`  ${col.id}: ${snap.size} docs`);

    // Check subcollections of first doc
    if (snap.size > 0) {
      const firstDoc = snap.docs[0];
      const subCols = await firstDoc.ref.listCollections();
      if (subCols.length > 0) {
        for (const sub of subCols) {
          const subSnap = await sub.get();
          console.log(`    └─ ${col.id}/{id}/${sub.id}: ${subSnap.size} docs (subcollection)`);
        }
      }
    }
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
