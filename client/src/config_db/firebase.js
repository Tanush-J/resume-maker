// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";  // <-- Importing storage
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDesHpVnLdSvz-4yjCKVyxFCejBSbzSXgo",
    authDomain: "resumemaker-5782f.firebaseapp.com",
    projectId: "resumemaker-5782f",
    storageBucket: "resumemaker-5782f.appspot.com",
    messagingSenderId: "303506220736",
    appId: "1:303506220736:web:14808ae09e1c023af06f25"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const storage = getStorage(app);  // <-- Initializing storage

export { app, auth, db, storage };  // <-- Exporting storage
