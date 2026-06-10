import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const logoutBtn = document.getElementById('logoutBtn');

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }

    // Show a placeholder while fetching the real name
    document.getElementById('userName').textContent = '...';

    // Fetch the customer's full name from the database (one‑time read)
    try {
        const snapshot = await get(ref(db, `users/${user.uid}`));
        const userData = snapshot.val();
        const displayName = userData?.fullName || user.displayName || 'Traveler';
        document.getElementById('userName').textContent = displayName;
    } catch (err) {
        console.error('Failed to load customer name', err);
        document.getElementById('userName').textContent = user.displayName || 'Traveler';
    }

    initializeDashboard(user.uid);
});

function initializeDashboard(userId) {
    // Profile data for loyalty points
    onValue(ref(db, `users/${userId}`), (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            document.getElementById('loyaltyPoints').textContent = (data.loyaltyPoints || 0).toLocaleString();
        }
    });

    // Bookings – all calculations
    onValue(ref(db, `bookings/${userId}`), (snapshot) => {
        const bookingsObj = snapshot.val() || {};
        const bookings = Object.values(bookingsObj);

        // Stats
        document.getElementById('totalBookings').textContent = bookings.length;

        const now = Date.now();
        const upcoming = bookings.filter(b => b.status === 'Confirmed' && new Date(b.departureDate).getTime() > now).length;
        const completed = bookings.filter(b => b.status === 'Confirmed' && new Date(b.departureDate).getTime() <= now).length;
        document.getElementById('upcomingTrips').textContent = upcoming;
        document.getElementById('completedTrips').textContent = completed;

        // Bookings table (sorted by departure date)
        const sorted = [...bookings].sort((a, b) => (a.departureDate || '').localeCompare(b.departureDate || ''));
        const tbody = document.getElementById('bookings-table-body');
        tbody.innerHTML = sorted.length === 0
            ? '<tr><td colspan="5" class="py-8 text-center text-gray-400">No bookings yet. Start your first adventure!</td></tr>'
            : sorted.map(b => `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-4 font-semibold">${b.packageName || 'Unknown'}</td>
                    <td class="py-4 text-gray-500">${b.destination || 'N/A'}</td>
                    <td class="py-4 text-gray-500">${b.departureDate ? new Date(b.departureDate).toLocaleDateString() : 'TBD'}</td>
                    <td class="py-4"><span class="status-pill ${b.status === 'Confirmed' ? 'status-confirmed' : b.status === 'Pending' ? 'status-pending' : 'status-cancelled'}">${b.status || 'Pending'}</span></td>
                    <td class="py-4 text-teal-600 font-medium hover:underline cursor-pointer">Details</td>
                </tr>
            `).join('');

        // Odyssey (latest confirmed booking)
        const odysseyList = document.getElementById('odyssey-list');
        const confirmed = bookings.filter(b => b.status === 'Confirmed').sort((a, b) => new Date(b.departureDate) - new Date(a.departureDate));
        odysseyList.innerHTML = confirmed.length > 0
            ? confirmed.slice(0, 1).map(b => `
                <div class="relative h-32 rounded-xl overflow-hidden group cursor-pointer">
                    <img src="${b.image || 'https://via.placeholder.com/400x200'}" class="absolute inset-0 w-full h-full object-cover transition transform group-hover:scale-110">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                        <h4 class="font-bold text-white text-sm">${b.packageName}</h4>
                        <p class="text-white/80 text-xs">${b.destination}</p>
                    </div>
                </div>
            `).join('')
            : '<p class="text-xs text-gray-400 italic">No upcoming adventures yet.</p>';
    });
}

logoutBtn.addEventListener('click', () => signOut(auth).then(() => window.location.href = '/html/home.html'));