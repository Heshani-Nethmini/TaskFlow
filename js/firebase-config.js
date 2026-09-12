import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDwT0mRqXN2rWvgAxuF3XkN-5Nq9iLu2oA",
  authDomain: "taskflow-91778.firebaseapp.com",
  databaseURL: "https://taskflow-91778-default-rtdb.firebaseio.com",
  projectId: "taskflow-91778",
  storageBucket: "taskflow-91778.firebasestorage.app",
  messagingSenderId: "405910099225",
  appId: "1:405910099225:web:071b6c8fa7282c8e526188",
  measurementId: "G-EX203BGMH9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);