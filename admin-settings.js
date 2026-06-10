import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut, updateProfile, updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const fullNameInput = document.getElementById('fullName');
const phoneInput = document.getElementById('phone');
const emailInput = document.getElementById('email');
const newPasswordInput = document.getElementById('newPassword');
const profileMsg = document.getElementById('profileMsg');
const passwordMsg = document.getElementById('passwordMsg');
const logoutBtn = document.getElementById('logoutBtn');

let currentUser = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }
    currentUser = user;
    document.getElementById('adminName').textContent = user.displayName || 'Admin User';
    emailInput.value = user.email || '';

    // Load phone from database
    try {
        const token = await user.getIdToken();
        const snap = await get(ref(db, `users/${user.uid}`));
        const userData = snap.val();
        if (userData) {
            fullNameInput.value = userData.fullName || '';
            phoneInput.value = userData.phone || '';
        } else {
            fullNameInput.value = user.displayName || '';
        }
    } catch (err) {
        console.error('Failed to load profile', err);
    }
});

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = fullNameInput.value.trim();
    const newPhone = phoneInput.value.trim();

    const promises = [];
    if (newName && newName !== currentUser.displayName) {
        promises.push(updateProfile(currentUser, { displayName: newName }));
    }
    if (newName || newPhone) {
        promises.push(update(ref(db, `users/${currentUser.uid}`), { fullName: newName, phone: newPhone }));
    }

    if (promises.length === 0) {
        profileMsg.textContent = 'No changes made.';
        profileMsg.className = 'text-gray-500';
        return;
    }

    try {
        await Promise.all(promises);
        document.getElementById('adminName').textContent = newName || currentUser.displayName;
        profileMsg.textContent = 'Profile updated successfully.';
        profileMsg.className = 'text-green-600';
    } catch (err) {
        profileMsg.textContent = 'Error: ' + err.message;
        profileMsg.className = 'text-red-500';
    }
});

passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = newPasswordInput.value;
    if (!newPass) return;

    try {
        await updatePassword(currentUser, newPass);
        passwordMsg.textContent = 'Password changed successfully.';
        passwordMsg.className = 'text-green-600';
        newPasswordInput.value = '';
    } catch (err) {
        passwordMsg.textContent = 'Error: ' + err.message;
        passwordMsg.className = 'text-red-500';
    }
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});