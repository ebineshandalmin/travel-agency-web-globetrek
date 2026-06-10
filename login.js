import { auth } from './firebase.js';
import { 
    signInWithEmailAndPassword, 
    setPersistence, 
    browserLocalPersistence, 
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ---------- LOGIN FORM ----------
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberCheck = document.getElementById('remember');
const submitBtn = document.getElementById('submitBtn');
const errorDisplay = document.getElementById('errorMessage');
const togglePassword = document.getElementById('togglePassword');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    const icon = togglePassword.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDisplay.classList.add('hidden');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Authenticating...`;
    submitBtn.disabled = true;

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const persistence = rememberCheck.checked ? browserLocalPersistence : browserSessionPersistence;

    try {
        await setPersistence(auth, persistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (email.endsWith('@admingt.com')) {
            window.location.href = '/html/admin.html';
        } else if (email.endsWith('@staffgt.com')) {
            window.location.href = '/html/staff.html';
        } else {
            window.location.href = '/html/customer.html';
        }
    } catch (error) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        errorDisplay.classList.remove('hidden');
        switch (error.code) {
            case 'auth/user-not-found':
                errorDisplay.textContent = "No explorer profile found with this email.";
                break;
            case 'auth/wrong-password':
                errorDisplay.textContent = "Incorrect password.";
                break;
            case 'auth/invalid-email':
                errorDisplay.textContent = "Invalid email address.";
                break;
            default:
                errorDisplay.textContent = "Authentication failed. Please try again.";
        }
    }
});

// ---------- FORGOT PASSWORD ----------
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const forgotModal = document.getElementById('forgotModal');
const closeForgotModal = document.getElementById('closeForgotModal');
const forgotForm = document.getElementById('forgotForm');
const forgotEmailInput = document.getElementById('forgotEmail');
const forgotMsg = document.getElementById('forgotMsg');

// Open modal when "Forgot password?" is clicked
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();   // prevent jumping to top
    forgotModal.classList.remove('hidden');
    forgotMsg.classList.add('hidden');
    forgotMsg.textContent = '';
    forgotEmailInput.value = '';
});

// Close modal
closeForgotModal.addEventListener('click', () => {
    forgotModal.classList.add('hidden');
});

// Send reset email
forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = forgotEmailInput.value.trim();
    if (!email) return;

    try {
        await sendPasswordResetEmail(auth, email);
        forgotMsg.textContent = 'Reset link sent! Check your inbox.';
        forgotMsg.className = 'mt-4 text-sm text-center font-medium text-green-600';
        forgotMsg.classList.remove('hidden');
        forgotEmailInput.value = '';
        // Close modal after 2 seconds
        setTimeout(() => forgotModal.classList.add('hidden'), 2500);
    } catch (error) {
        forgotMsg.textContent = error.message;
        forgotMsg.className = 'mt-4 text-sm text-center font-medium text-red-500';
        forgotMsg.classList.remove('hidden');
    }
});