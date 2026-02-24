const admin = require('firebase-admin');

// Initialize Firebase Admin
let db;

const initializeFirebase = () => {
  // Method 1: Try to load service account from JSON file (local development)
  try {
    const serviceAccount = require('../serviceAccountKey.json');
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`
    });
    
    console.log('✅ Firebase initialized with service account file');
    console.log(`📦 Project: ${serviceAccount.project_id}`);
    return admin.firestore();
  } catch (fileError) {
    // File not found, try environment variable
  }
  
  // Method 2: Load service account from environment variable (Render deployment)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8')
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: `${serviceAccount.project_id}.appspot.com`
      });
      
      console.log('✅ Firebase initialized with service account from env');
      console.log(`📦 Project: ${serviceAccount.project_id}`);
      return admin.firestore();
    } catch (envError) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', envError.message);
    }
  }
  
  // Method 3: Fallback - use project ID only (limited functionality)
  const projectId = process.env.FIREBASE_PROJECT_ID || 'mani-me-app';
  console.log('⚠️  No service account found, using demo mode');
  console.log(`📋 Project ID: ${projectId}`);
  console.log('⚠️  Chat and real-time features may not work without proper authentication');
  
  admin.initializeApp({
    projectId: projectId,
    storageBucket: `${projectId}.appspot.com`
  });
  
  return admin.firestore();
};

db = initializeFirebase();

module.exports = { admin, db };
