// js/auth.js
import { auth } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged,
  updateProfile 
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const authForm = document.getElementById("auth-form");
const formTitle = document.getElementById("form-title");
const nameFieldContainer = document.getElementById("name-field-container");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const toggleBtn = document.getElementById("toggle-btn");
const switchText = document.getElementById("switch-text");
const errorMsg = document.getElementById("error-msg");

let isSignUp = false;

// Toggle between Sign In and Create Account modes
toggleBtn.addEventListener("click", () => {
  isSignUp = !isSignUp;
  errorMsg.textContent = "";

  if (isSignUp) {
    formTitle.textContent = "Create Account";
    nameFieldContainer.style.display = "block";
    nameInput.required = true;
    submitBtn.textContent = "Create account";
    switchText.innerHTML = `Already have an account? <span id="toggle-btn" style="color: #2563eb; cursor: pointer; font-weight: bold;">Sign in</span>`;
  } else {
    formTitle.textContent = "Sign In to TaskFlow";
    nameFieldContainer.style.display = "none";
    nameInput.required = false;
    submitBtn.textContent = "Sign In";
    switchText.innerHTML = `Don't have an account? <span id="toggle-btn" style="color: #2563eb; cursor: pointer; font-weight: bold;">Create account</span>`;
  }
  
  document.getElementById("toggle-btn").addEventListener("click", arguments.callee);
});

// Handle Form Submission
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";
  
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    if (isSignUp) {
      const name = nameInput.value;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      alert("Account created successfully!");
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
    window.location.href = "dashboard.html";
  } catch (error) {
    errorMsg.textContent = error.message;
  }
});

onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.includes("index.html")) {
    window.location.href = "dashboard.html";
  }
});