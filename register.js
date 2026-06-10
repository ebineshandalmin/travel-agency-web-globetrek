import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const registerForm = document.getElementById('registerForm');
const statusMessage = document.getElementById('statusMessage');
const submitBtn = document.getElementById('submitBtn');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showStatus("Passwords do not match!", "red");
        return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Creating account...`;
    submitBtn.disabled = true;

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Determine role based on email domain
        let userRole = "customer";
        if (email.endsWith('@admingt.com')) userRole = "admin";
        else if (email.endsWith('@staffgt.com')) userRole = "staff";

        // Save user data to Realtime Database
        await set(ref(db, 'users/' + user.uid), {
            fullName,
            email,
            phone,
            role: userRole,
            createdAt: new Date().toISOString()
        });

        showStatus("Account created! Redirecting...", "green");

        // Redirect based on role
        setTimeout(() => {
            if (userRole === 'admin') {
                window.location.href = '/html/admin.html';
            } else if (userRole === 'staff') {
                window.location.href = '/html/staff.html';
            } else {
                window.location.href = '/html/customer.html';
            }
        }, 2000);

    } catch (error) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        showStatus(error.message, "red");
    }
});

function showStatus(msg, color) {
    statusMessage.textContent = msg;
    statusMessage.className = `text-${color}-500 text-sm text-center font-medium`;
    statusMessage.classList.remove('hidden');
}