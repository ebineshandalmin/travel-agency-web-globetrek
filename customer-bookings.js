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
    await fetchBookings();
});

async function fetchBookings() {
    const loading = document.getElementById('loadingIndicator');
    const error = document.getElementById('errorMessage');
    const container = document.getElementById('bookingsContainer');
    const tbody = document.getElementById('bookingsTableBody');

    try {
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        container.classList.add('hidden');

        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE}/bookings/${currentUserId}.json?auth=${token}`);
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        loading.classList.add('hidden');

        if (!data) {
            tbody.innerHTML = '<tr><td colspan="5" class="py-10 text-center text-gray-400">No bookings yet.</td></tr>';
            container.classList.remove('hidden');
            return;
        }

        const bookings = Object.values(data);
        tbody.innerHTML = bookings.map(b => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-4 font-semibold">${b.packageName || '—'}</td>
                <td class="py-4 text-gray-500">${b.destination || '—'}</td>
                <td class="py-4 text-gray-500">${b.departureDate ? new Date(b.departureDate).toLocaleDateString() : '—'}</td>
                <td class="py-4">
                    <span class="status-pill ${b.status === 'Confirmed' ? 'status-confirmed' : b.status === 'Pending' ? 'status-pending' : 'status-cancelled'}">${b.status || 'PENDING'}</span>
                </td>
                <td class="py-4 text-teal-600 font-medium hover:underline cursor-pointer">Details</td>
            </tr>
        `).join('');
        container.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
        error.classList.remove('hidden');
    }
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});