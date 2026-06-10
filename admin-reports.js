import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const reportStats = document.getElementById('reportStats');
const recentBookingsBody = document.getElementById('recentBookingsBody');
const logoutBtn = document.getElementById('logoutBtn');

let barChart, pieChart;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        document.getElementById('adminName').textContent = user.displayName || 'Admin User';
        loadReportData();
    }
});

function loadReportData() {
    onValue(ref(db, 'packages'), (packagesSnap) => {
        onValue(ref(db, 'bookings'), (bookingsSnap) => {
            onValue(ref(db, 'users'), (usersSnap) => {
                const packages = packagesSnap.val() || {};
                const users = usersSnap.val() || {};
                const bookingsData = bookingsSnap.val() || {};

                let totalRevenue = 0;
                let totalBookings = 0;
                const dailyBookings = new Array(7).fill(0); // last 7 days (oldest first)
                const statusCount = { Confirmed: 0, Pending: 0, Cancelled: 0 };
                const allBookings = [];
                const now = new Date();

                // Flatten bookings
                Object.keys(bookingsData).forEach(uid => {
                    Object.entries(bookingsData[uid]).forEach(([bid, b]) => {
                        totalRevenue += b.totalPrice || 0;
                        totalBookings++;
                        allBookings.push({ ...b, userId: uid });

                        // Status counting
                        if (b.status && statusCount.hasOwnProperty(b.status)) {
                            statusCount[b.status]++;
                        } else {
                            statusCount['Pending']++;
                        }

                        // Daily bucket
                        const date = new Date(b.bookedAt);
                        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
                        if (diffDays >= 0 && diffDays < 7) {
                            dailyBookings[6 - diffDays]++; // index 0 = 7 days ago
                        }
                    });
                });

                // Update stats cards
                reportStats.innerHTML = `
                    <div class="stat-card">
                        <div class="flex justify-between items-start mb-4">
                            <div class="p-3 bg-teal-100 text-teal-700 rounded-xl"><i class="fas fa-box text-xl"></i></div>
                        </div>
                        <h3 class="text-3xl font-bold text-gray-800">${Object.keys(packages).length}</h3>
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Total Packages</p>
                    </div>
                    <div class="stat-card">
                        <div class="flex justify-between items-start mb-4">
                            <div class="p-3 bg-green-100 text-green-700 rounded-xl"><i class="fas fa-ticket-alt text-xl"></i></div>
                        </div>
                        <h3 class="text-3xl font-bold text-gray-800">${totalBookings}</h3>
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Total Bookings</p>
                    </div>
                    <div class="stat-card">
                        <div class="flex justify-between items-start mb-4">
                            <div class="p-3 bg-indigo-100 text-indigo-700 rounded-xl"><i class="fas fa-wallet text-xl"></i></div>
                        </div>
                        <h3 class="text-3xl font-bold text-gray-800">$${totalRevenue.toLocaleString()}</h3>
                        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Total Revenue</p>
                    </div>
                `;

                // Bar Chart (Daily Bookings)
                const barCtx = document.getElementById('barChart').getContext('2d');
                if (barChart) barChart.destroy();
                const labels = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(now.getDate() - i);
                    labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                }
                barChart = new Chart(barCtx, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Bookings',
                            data: dailyBookings,
                            backgroundColor: '#0F766E',
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                    }
                });

                // Pie Chart (Status Breakdown)
                const pieCtx = document.getElementById('pieChart').getContext('2d');
                if (pieChart) pieChart.destroy();
                pieChart = new Chart(pieCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Confirmed', 'Pending', 'Cancelled'],
                        datasets: [{
                            data: [statusCount.Confirmed, statusCount.Pending, statusCount.Cancelled],
                            backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });

                // Recent Bookings Table (last 5)
                allBookings.sort((a, b) => b.bookedAt - a.bookedAt);
                const recent = allBookings.slice(0, 5);
                recentBookingsBody.innerHTML = recent.map(b => `
                    <tr class="border-b border-gray-100 hover:bg-gray-50">
                        <td class="py-4 flex items-center gap-3 font-semibold">
                            <img src="${b.image || 'https://via.placeholder.com/40'}" class="w-10 h-10 rounded-lg object-cover">
                            ${b.packageName}
                        </td>
                        <td class="py-4 text-gray-500">${users[b.userId]?.email || 'N/A'}</td>
                        <td class="py-4 text-gray-500">${new Date(b.bookedAt).toLocaleDateString()}</td>
                        <td class="py-4 font-bold">$${b.totalPrice}</td>
                        <td class="py-4">
                            <span class="status-pill ${b.status === 'Confirmed' ? 'status-confirmed' : b.status === 'Pending' ? 'status-pending' : 'status-cancelled'}">${b.status}</span>
                        </td>
                    </tr>
                `).join('') || '<tr><td colspan="5" class="py-8 text-center text-gray-400">No bookings yet</td></tr>';
            });
        });
    });
}

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});