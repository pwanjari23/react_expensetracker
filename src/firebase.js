import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Detect if Firebase config has been filled out
const isDummyConfig = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === "" || 
  firebaseConfig.apiKey.includes("your_api_key_here");

let app;
let auth;
let db;

if (isDummyConfig) {
  console.warn(
    "⚠️ Firebase is running in Demo Mock Mode because valid keys were not found in `.env.local`.\n" +
    "To connect to your live Firebase database, please fill in your credentials inside the `.env.local` file."
  );
  auth = null;
  db = null;
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    auth = null;
    db = null;
  }
}

export { auth, db, isDummyConfig };
export default auth;
