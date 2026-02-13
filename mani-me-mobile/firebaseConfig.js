// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCHs6DbpXKsVLnsnCfBvfLqgfzmC_a-7OU",
  authDomain: "mani-me-app.firebaseapp.com",
  projectId: "mani-me-app",
  storageBucket: "mani-me-app.firebasestorage.app",
  messagingSenderId: "508869526140",
  appId: "1:508869526140:web:05cc2952dc93333a3abff9",
  measurementId: "G-M171FS6DS1"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
