import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const bookingsList = document.getElementById('bookingsList');
const recentQueriesContainer = document.getElementById('recentQueriesContainer');
const packageCardsContainer = document.getElementById('packageCardsContainer');
const logoutBtn = document.getElementById('logoutBtn');
let usersMap = {};

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }
    if (!user.email.endsWith('@staffgt.com') && !user.email.endsWith('@admingt.com')) {
        window.location.href = '/html/customer.html';
        return;
    }

    // Show placeholder while fetching the real name
    document.getElementById('staffName').textContent = '...';

    // Fetch the staff's full name from the database
    onValue(ref(db, `users/${user.uid}`), (snapshot) => {
        const userData = snapshot.val();
        const displayName = userData?.fullName || user.displayName || 'Staff Member';
        document.getElementById('staffName').textContent = displayName;
    }, { onlyOnce: true });

    loadDashboardData();
});

function loadDashboardData() {
    // Load users for email mapping
    onValue(ref(db, 'users'), (snapshot) => {
        const users = snapshot.val() || {};
        usersMap = {};
        Object.entries(users).forEach(([uid, u]) => { usersMap[uid] = u.email || 'N/A'; });
    });

    // Packages count + mini cards
    onValue(ref(db, 'packages'), (snapshot) => {
        const packages = snapshot.val() || {};
        document.getElementById('statActivePackages').textContent = Object.keys(packages).length;
        const pkgArray = Object.entries(packages).map(([id, p]) => ({ id, ...p }));
        packageCardsContainer.innerHTML = pkgArray.slice(-3).map(p => `
            <div class="flex items-start gap-4 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition">
                <img src="${p.image}" class="w-12 h-12 rounded-xl object-cover">
                <div class="flex-1">
                    <h4 class="font-semibold text-gray-800 text-sm">${p.title}</h4>
                    <p class="text-xs text-gray-500">${p.destination}</p>
                    <span class="font-bold text-teal-700 text-sm">$${p.price}</span>
                </div>
            </div>
        `).join('') || '<p class="text-gray-400 text-sm text-center">No packages yet</p>';
    });

    // Bookings stats + latest list
    onValue(ref(db, 'bookings'), (snapshot) => {
        const data = snapshot.val() || {};
        const flat = [];
        let pendingCount = 0;
        Object.keys(data).forEach(uid => {
            Object.entries(data[uid]).forEach(([bid, b]) => {
                flat.push({ ...b, bid, userId: uid });
                if (b.status === 'Pending') pendingCount++;
            });
        });
        document.getElementById('statTotalBookings').textContent = flat.length;
        document.getElementById('statPendingBookings').textContent = pendingCount;

        const sorted = flat.sort((a, b) => b.bookedAt - a.bookedAt).slice(0, 6);
        bookingsList.innerHTML = sorted.length === 0
            ? '<p class="text-gray-400 text-center py-8">No bookings yet</p>'
            : sorted.map(b => `
                <div class="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div class="flex items-center gap-4">
                        <img src="${b.image || 'https://via.placeholder.com/40'}" class="w-12 h-12 rounded-lg object-cover">
                        <div>
                            <h4 class="font-bold text-sm">${b.packageName}</h4>
                            <p class="text-xs text-gray-400">${usersMap[b.userId] || 'N/A'} · ${new Date(b.bookedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-sm">$${b.totalPrice}</p>
                        <span class="status-pill ${b.status === 'Confirmed' ? 'status-confirmed' : b.status === 'Pending' ? 'status-pending' : 'status-cancelled'}">${b.status}</span>
                    </div>
                </div>
            `).join('');
    });

    // Merged queries (users + contact messages)
    loadQueries();
}

function loadQueries() {
    onValue(ref(db, 'queries'), (userQueriesSnap) => {
        onValue(ref(db, 'contactMessages'), (visitorSnap) => {
            const userQueries = userQueriesSnap.val() || {};
            const visitorQueries = visitorSnap.val() || {};
            const allQueries = [];

            Object.keys(userQueries).forEach(uid => {
                Object.entries(userQueries[uid]).forEach(([qid, q]) => {
                    allQueries.push({ ...q, id: qid, type: 'user', userId: uid });
                });
            });
            Object.entries(visitorQueries).forEach(([id, msg]) => {
                allQueries.push({ ...msg, id, type: 'visitor' });
            });

            document.getElementById('statQueries').textContent = allQueries.length;
            allQueries.sort((a, b) => b.timestamp - a.timestamp);
            const recent = allQueries.slice(0, 5);
            recentQueriesContainer.innerHTML = recent.length === 0
                ? '<p class="text-gray-400 text-center py-4">No queries yet</p>'
                : recent.map(q => `
                    <div class="p-4 border border-gray-100 rounded-xl">
                        <div class="flex justify-between mb-1">
                            <span class="text-xs font-semibold text-gray-700">
                                ${q.type === 'visitor' ? `🌐 ${q.name}` : '👤 Registered User'}
                            </span>
                            <span class="text-xs text-gray-400">${new Date(q.timestamp).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
                        </div>
                        <p class="text-xs text-gray-600 line-clamp-2">${q.message}</p>
                        <span class="text-[10px] font-bold text-teal-600 uppercase">${q.status}</span>
                    </div>
                `).join('');
        });
    });
}

logoutBtn.addEventListener('click', () => signOut(auth).then(() => window.location.href = '/html/home.html'));