const admin = require('firebase-admin');

// Initialize Firebase Admin
// For development without service account
let db;

try {
  // Try to load service account key if it exists
  const serviceAccount = require('../serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  db = admin.firestore();
  console.log('✅ Firebase initialized with service account');
} catch (error) {
  // If no service account, use environment variable for project ID
  const projectId = process.env.FIREBASE_PROJECT_ID || 'mani-me-demo';
  
  console.log('⚠️  No service account found, using demo mode');
  console.log(`📋 Project ID: ${projectId}`);
  
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: projectId
  });
  
  db = admin.firestore();
  console.log('✅ Firebase initialized in demo mode');
}

module.exports = { admin, db };
