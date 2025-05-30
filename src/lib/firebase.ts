import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1H07UA2Vn9XJ0AEbfTySZv6NUSp2PPEg",
  authDomain: "tonbox-3ad67.firebaseapp.com",
  projectId: "tonbox-3ad67",
  storageBucket: "tonbox-3ad67.firebasestorage.app",
  messagingSenderId: "836226410788",
  appId: "1:836226410788:web:e677e6c9d89a1f6912ebb1",
  measurementId: "G-QG6X9BK9SM"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };