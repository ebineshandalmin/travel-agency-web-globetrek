import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const bookingsTableBody = document.getElementById('bookingsTableBody');
const statusFilter = document.getElementById('statusFilter');
const searchBooking = document.getElementById('searchBooking');
const bookingCount = document.getElementById('bookingCount');
const logoutBtn = document.getElementById('logoutBtn');
let allBookings = [];
let usersMap = {};

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        document.getElementById('adminName').textContent = user.displayName || 'Admin User';
        loadUsers();
        loadBookings();
    }
});

function loadUsers() {
    onValue(ref(db, 'users'), (snapshot) => {
        const users = snapshot.val() || {};
        usersMap = {};
        Object.entries(users).forEach(([uid, u]) => {
            usersMap[uid] = u.email || 'N/A';
        });
        renderBookings();
    });
}

function loadBookings() {
    onValue(ref(db, 'bookings'), (snapshot) => {
        const data = snapshot.val() || {};
        allBookings = [];
        Object.keys(data).forEach(userId => {
            Object.entries(data[userId]).forEach(([bookingId, booking]) => {
                allBookings.push({ ...booking, userId, bookingId });
            });
        });
        renderBookings();
    });
}

function renderBookings() {
    const filter = statusFilter.value;
    const search = searchBooking.value.toLowerCase();
    let filtered = allBookings.filter(b => {
        const emailMatch = usersMap[b.userId]?.toLowerCase().includes(search) || false;
        return (!filter || b.status === filter) &&
               (!search || b.packageName.toLowerCase().includes(search) || emailMatch);
    });
    bookingCount.textContent = `${filtered.length} bookings`;

    bookingsTableBody.innerHTML = filtered.map(b => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="py-4 flex items-center gap-3 font-semibold">
                <img src="${b.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg object-cover">
                ${b.packageName}
            </td>
            <td class="py-4 text-gray-500">${usersMap[b.userId] || 'N/A'}</td>
            <td class="py-4 text-gray-500">${new Date(b.bookedAt).toLocaleDateString()}</td>
            <td class="py-4 font-bold">$${b.totalPrice}</td>
            <td class="py-4">
                <span class="status-pill ${b.status === 'Confirmed' ? 'status-confirmed' : b.status === 'Pending' ? 'status-pending' : 'status-cancelled'}">${b.status}</span>
            </td>
            <td class="py-4">
                <div class="flex justify-center gap-2">
                    <select class="changeStatus text-xs border border-gray-200 rounded-lg p-1 focus:ring-teal-500" data-booking-id="${b.bookingId}" data-user-id="${b.userId}">
                        <option value="">Change Status</option>
                        <option value="Confirmed">Confirm</option>
                        <option value="Pending">Pending</option>
                        <option value="Cancelled">Cancel</option>
                    </select>
                </div>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.changeStatus').forEach(select => {
        select.addEventListener('change', (e) => {
            const status = e.target.value;
            if (!status) return;
            const bookingId = select.dataset.bookingId;
            const userId = select.dataset.userId;
            update(ref(db, `bookings/${userId}/${bookingId}`), { status })
                .catch(err => alert('Error: ' + err.message));
        });
    });
}

statusFilter.addEventListener('change', renderBookings);
searchBooking.addEventListener('input', renderBookings);

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});