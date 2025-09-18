// services/firebase.js (updated)
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyAPKpiVIL9lQsVqmTHweBLf9sucLoS5fIQ",
  authDomain: "fir-practice-4a6a8.firebaseapp.com",
  databaseURL: "https://fir-practice-4a6a8-default-rtdb.firebaseio.com",
  projectId: "fir-practice-4a6a8",
  storageBucket: "fir-practice-4a6a8.firebasestorage.app",
  messagingSenderId: "276078163493",
  appId: "1:276078163493:web:b7c5ede5a3939c621bf1cc",
  measurementId: "G-38QQZBRKWM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;