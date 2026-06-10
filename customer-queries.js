import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const DB_BASE = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';
let currentUserId = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }
    currentUserId = user.uid;
    await fetchQueries();
});

async function fetchQueries() {
    const container = document.getElementById('queriesList');
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE}/queries/${currentUserId}.json?auth=${token}`);
        const data = await res.json();
        if (!data) {
            container.innerHTML = '<p class="text-gray-400">No queries yet.</p>';
            return;
        }
        const queries = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
        container.innerHTML = queries.map(q => `
            <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs text-gray-400">${new Date(q.timestamp).toLocaleString()}</span>
                    <span class="text-xs font-semibold text-teal-600">${q.status || 'Open'}</span>
                </div>
                ${q.subject ? `<h4 class="font-semibold text-gray-700 mb-1">${q.subject}</h4>` : ''}
                <p class="text-sm text-gray-700 mb-2">${q.message}</p>
                ${q.reply ? `
                <div class="mt-2 p-3 bg-teal-50 rounded-lg text-sm text-teal-800">
                    <strong>Reply:</strong> ${q.reply}
                </div>` : ''}
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-red-500">Failed to load queries.</p>';
    }
}

document.getElementById('queryForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = document.getElementById('queryMessage').value.trim();
    const subject = document.getElementById('querySubject').value.trim();
    const msgEl = document.getElementById('submitMsg');
    if (!message) return;

    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE}/queries/${currentUserId}.json?auth=${token}`, {
            method: 'POST',
            body: JSON.stringify({
                message,
                subject: subject || 'No Subject',
                timestamp: Date.now(),
                status: 'Open'
            })
        });
        if (!res.ok) throw new Error('Submit failed');
        document.getElementById('queryMessage').value = '';
        document.getElementById('querySubject').value = '';
        msgEl.textContent = 'Query submitted!';
        msgEl.className = 'text-green-600 text-sm';
        fetchQueries();
    } catch (err) {
        console.error(err);
        msgEl.textContent = 'Failed to submit query.';
        msgEl.className = 'text-red-600 text-sm';
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});