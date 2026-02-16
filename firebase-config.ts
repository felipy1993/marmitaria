
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBIL_lVJjKg-CUlfbXKY7uHPaR8s_FY_GY",
  authDomain: "marmitas-608b3.firebaseapp.com",
  projectId: "marmitas-608b3",
  storageBucket: "marmitas-608b3.firebasestorage.app",
  messagingSenderId: "215930578772",
  appId: "1:215930578772:web:dc8f67e474ee19c10c4ac1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
