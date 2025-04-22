// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { db };