const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'asm-internal-portal.firebasestorage.app'
});

const bucket = admin.storage().bucket();
const basePath = path.join(__dirname, '..', 'storage');

async function downloadAll() {
  try {
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} files in Firebase Storage to download.`);
    
    let downloadedCount = 0;

    for (const file of files) {
      // Ignore folder placeholder files that Firebase sometimes creates
      if (file.name.endsWith('/')) continue;

      let localRelativePath = file.name;
      
      // Auto-map folders according to our migration plan
      if (file.name.startsWith('homework/')) {
        localRelativePath = file.name.replace('homework/', 'private/homework/');
      } else if (file.name.startsWith('resources/')) {
        localRelativePath = file.name.replace('resources/', 'public/resources/');
      } else if (file.name.startsWith('module_resources/')) {
        localRelativePath = file.name.replace('module_resources/', 'public/module_resources/');
      } else if (!localRelativePath.startsWith('public/') && !localRelativePath.startsWith('private/')) {
         localRelativePath = `public/${localRelativePath}`;
      }

      const localPath = path.join(basePath, localRelativePath);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      console.log(`Downloading ${file.name} to ${localRelativePath}...`);
      await file.download({ destination: localPath });
      downloadedCount++;
    }
    console.log(`\n✅ Download complete! Successfully downloaded ${downloadedCount} files to: ${basePath}`);
  } catch (error) {
    if (error.code === 404) {
      console.error("Bucket not found. Attempting fallback bucket name format...");
      tryFallbackBucket();
    } else {
      console.error("Error downloading files:", error);
    }
  }
}

async function tryFallbackBucket() {
  const fallbackBucketName = 'asm-internal-portal.appspot.com';
  const fallbackBucket = admin.app().storage().bucket(fallbackBucketName);
  
  try {
    const [files] = await fallbackBucket.getFiles();
    console.log(`Found ${files.length} files in Firebase Storage (fallback bucket) to download.`);
    
    let downloadedCount = 0;
    for (const file of files) {
      if (file.name.endsWith('/')) continue;

      let localRelativePath = file.name;
      if (file.name.startsWith('homework/')) {
        localRelativePath = file.name.replace('homework/', 'private/homework/');
      } else if (file.name.startsWith('resources/')) {
        localRelativePath = file.name.replace('resources/', 'public/resources/');
      } else if (file.name.startsWith('module_resources/')) {
        localRelativePath = file.name.replace('module_resources/', 'public/module_resources/');
      } else if (!localRelativePath.startsWith('public/') && !localRelativePath.startsWith('private/')) {
         localRelativePath = `public/${localRelativePath}`;
      }

      const localPath = path.join(basePath, localRelativePath);
      const dir = path.dirname(localPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      console.log(`Downloading ${file.name} to ${localRelativePath}...`);
      await file.download({ destination: localPath });
      downloadedCount++;
    }
    console.log(`\n✅ Download complete! Successfully downloaded ${downloadedCount} files to: ${basePath}`);
  } catch (error) {
     console.error("Fallback bucket also failed:", error.message);
  }
}

downloadAll();
