import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcILqzoFaeFJz0Q5dCQr88Jp3UcWOoU9s",
  authDomain: "viewinger.firebaseapp.com",
  projectId: "viewinger",
  storageBucket: "viewinger.firebasestorage.app",
  messagingSenderId: "121731429345",
  appId: "1:121731429345:web:a28b53d4776e25935298a0",
  measurementId: "G-HSTP1K3SVX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);