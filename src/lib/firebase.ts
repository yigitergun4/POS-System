// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCv22fJab6XcrivwkrqIrqTtBSsf0kRlYs",
  authDomain: "posystem-aec94.firebaseapp.com",
  projectId: "posystem-aec94",
  storageBucket: "posystem-aec94.firebasestorage.app",
  messagingSenderId: "1068943916639",
  appId: "1:1068943916639:web:7d86855001ad244d9265ea",
  measurementId: "G-9FN0772YQN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
export const db = getFirestore(app);

export { app, analytics };
