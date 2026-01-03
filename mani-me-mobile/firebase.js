// firebase.js
// Connects the app to Firebase, handles Firestore read/write for drivers and users.

import { app, auth, db } from './firebaseConfig';
import { doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export const addParcel = async (parcelData) => {
  return addDoc(collection(db, 'parcels'), parcelData);
};

export const getParcelsByUser = async (uid) => {
  const q = query(collection(db, 'parcels'), where('userId', '==', uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export { app, auth, db };