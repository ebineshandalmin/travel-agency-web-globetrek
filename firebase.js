import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBQJiVBWoQwofdhNPOZUKBrTedGnenvx9Q",
    authDomain: "globe-trek-b1e87.firebaseapp.com",
    databaseURL: "https://globe-trek-b1e87-default-rtdb.firebaseio.com",
    projectId: "globe-trek-b1e87",
    storageBucket: "globe-trek-b1e87.firebasestorage.app",
    messagingSenderId: "748239028567",
    appId: "1:748239028567:web:141c5cad06cb0b6edbbe12",
    measurementId: "G-P2K63NQSDD"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);
export { auth, db };