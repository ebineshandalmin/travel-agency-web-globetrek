import { auth } from './firebase.js';
import { onAuthStateChanged, signOut, updateProfile, updatePassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const DB_BASE = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';
let currentUserId = null;
let isEditMode = false;

const editToggleBtn = document.getElementById('editToggleBtn');
const editActions = document.getElementById('editActions');
const cancelBtn = document.getElementById('cancelBtn');
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');
const profileMsg = document.getElementById('profileMsg');
const passwordMsg = document.getElementById('passwordMsg');
const fields = ['fullName', 'phone'];

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }
    currentUserId = user.uid;
    document.getElementById('view-email').textContent = user.email;
    await fetchProfile();
});

async function fetchProfile() {
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE}/users/${currentUserId}.json?auth=${token}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data) {
            document.getElementById('view-fullName').textContent = data.fullName || 'Not set';
            document.getElementById('view-phone').textContent = data.phone || 'Not set';
            document.getElementById('fullName').value = data.fullName || '';
            document.getElementById('phone').value = data.phone || '';
        }
    } catch (err) {
        console.error(err);
    }
}

function toggleEditMode(editing) {
    isEditMode = editing;
    editToggleBtn.classList.toggle('hidden', editing);
    editActions.classList.toggle('hidden', !editing);
    fields.forEach(field => {
        document.getElementById(`view-${field}`).classList.toggle('hidden', editing);
        document.getElementById(field).classList.toggle('hidden', !editing);
    });
}

editToggleBtn.addEventListener('click', () => toggleEditMode(true));
cancelBtn.addEventListener('click', () => {
    toggleEditMode(false);
    profileMsg.textContent = '';
});

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const promises = [];
    if (fullName && fullName !== auth.currentUser.displayName) {
        promises.push(updateProfile(auth.currentUser, { displayName: fullName }));
    }
    const token = await auth.currentUser.getIdToken();
    promises.push(fetch(`${DB_BASE}/users/${currentUserId}.json?auth=${token}`, {
        method: 'PATCH',
        body: JSON.stringify({ fullName, phone })
    }));

    try {
        await Promise.all(promises);
        profileMsg.textContent = 'Changes saved successfully!';
        profileMsg.className = 'text-green-600 text-sm font-medium';
        await fetchProfile();
        setTimeout(() => {
            toggleEditMode(false);
            profileMsg.textContent = '';
        }, 1500);
    } catch (err) {
        profileMsg.textContent = 'Error: Could not save changes.';
        profileMsg.className = 'text-red-600 text-sm font-medium';
    }
});

passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newPassword').value;
    if (!newPass) return;
    try {
        await updatePassword(auth.currentUser, newPass);
        passwordMsg.textContent = 'Password changed successfully.';
        passwordMsg.className = 'text-green-600 text-sm font-medium';
        document.getElementById('newPassword').value = '';
    } catch (err) {
        passwordMsg.textContent = 'Error: ' + err.message;
        passwordMsg.className = 'text-red-600 text-sm font-medium';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});