// Firebase Configuration
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyAz5_I_ZH8h5Oghf1WYxkfqsmeOCj1euMg",
    authDomain: "beerpedia-713d2.firebaseapp.com",
    projectId: "beerpedia-713d2",
    storageBucket: "beerpedia-713d2.firebasestorage.app",
    messagingSenderId: "642156655340",
    appId: "1:642156655340:web:b97f2ff2ed2390cc70ebc9",
    measurementId: "G-Z4274H0MXK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();

export { db, auth, collection, addDoc, getDocs, getDoc, doc, signInWithEmailAndPassword, onAuthStateChanged, signOut, provider, signInWithPopup, signInAnonymously };
