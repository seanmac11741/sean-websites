import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAuldkXQPPeXF5mURsyg8nFklnNNlYkGkA",
  authDomain: "sean-mcconnell-site.firebaseapp.com",
  projectId: "sean-mcconnell-site",
  storageBucket: "sean-mcconnell-site.firebasestorage.app",
  messagingSenderId: "184418052195",
  appId: "1:184418052195:web:8332500f04fbf9c1383056",
  measurementId: "G-9X4ZCDT7KD",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = "seanmac11741@gmail.com";
