/**
 * Firebase Configuration for Driver App
 * Uses environment variables or falls back to defaults
 * 
 * In production, these should be set via app.json extra or environment
 */

// Firebase configuration
// NOTE: These are client-side keys and are safe to include in the app bundle
// Server-side security is handled by Firestore security rules
export const firebaseConfig = {
  apiKey: "AIzaSyCHs6DbpXKsVLnsnCfBvfLqgfzmC_a-7OU",
  authDomain: "mani-me-app.firebaseapp.com",
  projectId: "mani-me-app",
  storageBucket: "mani-me-app.firebasestorage.app",
  messagingSenderId: "508869526140",
  appId: "1:508869526140:web:05cc2952dc93333a3abff9"
};

export default firebaseConfig;
