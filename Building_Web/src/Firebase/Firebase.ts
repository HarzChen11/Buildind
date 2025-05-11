// src/Firebase/Firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDN7Zb__8zaw-zwTIQ5LPHgNoUfcOfuowg",
    authDomain: "buildind-fab23.firebaseapp.com",
    projectId: "buildind-fab23",
    storageBucket: "buildind-fab23.appspot.com",
    messagingSenderId: "1066216967229",
    appId: "1:1066216967229:web:0a00d6337aecd537d9ae54",
    measurementId: "G-5PVP42KTTX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
