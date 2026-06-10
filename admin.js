import Toast from "./toast.js";
import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const bookingsList = document.getElementById('bookingsList');
const queriesContainer = document.getElementById('queriesContainer');
const usersList = document.getElementById('usersList');
const logoutBtn = document.getElementById('logoutBtn');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
        return;
    }

    // Show loading placeholder until we get the real name
    document.getElementById('adminName').textContent = '...';

    // Fetch the real name from the database
    onValue(ref(db, `users/${user.uid}`), (snapshot) => {
        const userData = snapshot.val();
        const displayName = userData?.fullName || user.displayName || 'Admin User';
        document.getElementById('adminName').textContent = displayName;
    }, { onlyOnce: true }); // only once is enough for the header

    loadDashboardData();
});

function loadDashboardData() {
    // Packages count
    onValue(ref(db, 'packages'), (snapshot) => {
        const packages = snapshot.val() || {};
        document.getElementById('statPackages').textContent = Object.keys(packages).length;
    });

    // Users count + display
    onValue(ref(db, 'users'), (snapshot) => {
        const users = snapshot.val() || {};
        document.getElementById('statUsers').textContent = Object.keys(users).length;
        usersList.innerHTML = '';
        if (Object.keys(users).length === 0) {
            usersList.innerHTML = '<div class="py-4 text-center text-gray-400"><i class="fas fa-user-friends text-3xl mb-2"></i><p>No users found</p></div>';
            return;
        }
        Object.entries(users).slice(0, 6).forEach(([uid, user]) => {
            const roleColors = { admin: 'border-teal-400 bg-teal-50', staff: 'border-blue-400 bg-blue-50', customer: 'border-pink-400 bg-pink-50' };
            const borderColor = roleColors[user.role] || 'border-gray-200 bg-gray-50';
            usersList.innerHTML += `
                <div class="flex items-center justify-between p-3 border rounded-xl ${borderColor}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                            ${(user.fullName||'U')[0]}
                        </div>
                        <div>
                            <p class="text-sm font-bold">${user.fullName}</p>
                            <p class="text-xs text-gray-400">${user.email}</p>
                        </div>
                    </div>
                    <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase">${user.role}</span>
                </div>
            `;
        });
    });

    // Bookings count + latest list (view only)
    onValue(ref(db, 'bookings'), (snapshot) => {
        const data = snapshot.val() || {};
        const flat = []; let revenue = 0;
        Object.keys(data).forEach(uid => Object.entries(data[uid]).forEach(([bid, b]) => { flat.push({...b,bid,userId:uid}); revenue += (b.totalPrice||0); }));
        document.getElementById('statBookings').textContent = flat.length;
        document.getElementById('statRevenue').textContent = `$${revenue.toLocaleString()}`;
        bookingsList.innerHTML = '';
        if (flat.length === 0) {
            bookingsList.innerHTML = '<div class="py-8 text-center text-gray-400"><i class="fas fa-calendar-check text-4xl mb-2"></i><p>No bookings yet</p></div>';
            return;
        }
        flat.sort((a,b) => b.bookedAt - a.bookedAt).slice(0,6).forEach(b => {
            bookingsList.innerHTML += `
                <div class="flex items-center justify-between p-4 border border-gray-100 rounded-xl">
                    <div class="flex items-center gap-4">
                        <img src="${b.image || 'https://via.placeholder.com/40'}" class="w-12 h-12 rounded-lg object-cover">
                        <div>
                            <h4 class="font-bold text-sm">${b.packageName}</h4>
                            <p class="text-xs text-gray-400">${new Date(b.bookedAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-sm">$${b.totalPrice}</p>
                        <span class="status-pill ${b.status==='Confirmed'?'status-confirmed': b.status==='Pending'?'status-pending':'status-cancelled'}">${b.status}</span>
                    </div>
                </div>
            `;
        });
    });

    // Queries (recent, view only)
    onValue(ref(db, 'queries'), (snapshot) => {
        const qdata = snapshot.val() || {};
        queriesContainer.innerHTML = '';
        if (Object.keys(qdata).length === 0) {
            queriesContainer.innerHTML = '<div class="py-6 text-center text-gray-400"><i class="fas fa-comment-dots text-3xl mb-2"></i><p>No queries yet</p></div>';
            return;
        }
        Object.keys(qdata).forEach(uid => {
            Object.entries(qdata[uid]).slice(0,2).forEach(([qid, q]) => {
                queriesContainer.innerHTML += `
                    <div class="p-4 border border-gray-100 rounded-xl">
                        <div class="flex justify-between mb-2">
                            <h4 class="font-semibold text-sm">User ID: ${uid.substring(0,6)}...</h4>
                            <span class="text-xs text-gray-400">${new Date(q.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                        <p class="text-xs text-gray-500 line-clamp-2">${q.message}</p>
                        <span class="text-[10px] font-bold text-teal-600 uppercase">${q.status}</span>
                    </div>
                `;
            });
        });
    });
}

logoutBtn.addEventListener('click', () => signOut(auth).then(() => window.location.href = '/html/home.html'));