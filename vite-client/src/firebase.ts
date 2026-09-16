// Import the functions you need from the SDKs you need
import { getFirestore } from "@firebase/firestore";
import type { Firestore } from "@firebase/firestore";
import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
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
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth: Auth = getAuth(app);

export const db: Firestore = getFirestore(app);
