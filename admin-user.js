import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const usersGrid = document.getElementById('usersGrid');
const logoutBtn = document.getElementById('logoutBtn');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        document.getElementById('adminName').textContent = user.displayName || 'Admin User';
        loadUsers();
    }
});

function loadUsers() {
    onValue(ref(db, 'users'), (snapshot) => {
        const users = snapshot.val() || {};
        usersGrid.innerHTML = '';

        if (Object.keys(users).length === 0) {
            usersGrid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">No users found</div>';
            return;
        }

        Object.entries(users).forEach(([userId, user]) => {
            const roleClass = user.role === 'admin' ? 'card-admin' : (user.role === 'staff' ? 'card-staff' : 'card-user');
            usersGrid.innerHTML += `
                <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 ${roleClass}">
                    <div class="flex items-start justify-between">
                        <div class="flex gap-3">
                            <div class="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">
                                ${(user.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-800">${user.fullName || 'Unnamed'}</h3>
                                <p class="text-sm text-gray-500">${user.email}</p>
                                <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-teal-100 text-teal-700' : (user.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}">${user.role}</span>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="promote-btn text-teal-600 hover:text-teal-800" title="Toggle role" data-id="${userId}" data-role="${user.role}">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button class="delete-btn text-red-500 hover:text-red-700" title="Delete user" data-id="${userId}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        // Promote button
        document.querySelectorAll('.promote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.dataset.id;
                const currentRole = btn.dataset.role;
                const newRole = currentRole === 'admin' ? 'customer' : (currentRole === 'staff' ? 'admin' : 'staff');
                if (confirm(`Change role from ${currentRole} to ${newRole}?`)) {
                    update(ref(db, `users/${userId}`), { role: newRole })
                        .catch(err => alert('Error: ' + err.message));
                }
            });
        });

        // Delete button
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userId = btn.dataset.id;
                if (confirm('Are you sure you want to delete this user?')) {
                    remove(ref(db, `users/${userId}`))
                        .catch(err => alert('Error: ' + err.message));
                }
            });
        });
    });
}

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});