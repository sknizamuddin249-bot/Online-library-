import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  DocumentData,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import configJson from '../../firebase-applet-config.json';

// Firebase configuration using project applet credentials
const firebaseConfig = {
  projectId: configJson.projectId,
  appId: configJson.appId,
  apiKey: configJson.apiKey,
  authDomain: configJson.authDomain,
  firestoreDatabaseId: configJson.firestoreDatabaseId,
  storageBucket: configJson.storageBucket,
  messagingSenderId: configJson.messagingSenderId,
};

// Initialize Firebase App
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID if configured
export const db = configJson.firestoreDatabaseId && configJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(firebaseApp, configJson.firestoreDatabaseId)
  : getFirestore(firebaseApp);

export const auth = getAuth(firebaseApp);

export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
};
