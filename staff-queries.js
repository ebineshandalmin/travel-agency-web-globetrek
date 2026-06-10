import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const queriesContainer = document.getElementById('queriesContainer');
const logoutBtn = document.getElementById('logoutBtn');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        if (user.email.endsWith('@staffgt.com') || user.email.endsWith('@admingt.com')) {
            document.getElementById('staffName').textContent = user.displayName || 'Staff';
            loadQueries();
        } else {
            window.location.href = '/html/customer.html';
        }
    }
});

function loadQueries() {
    onValue(ref(db, 'queries'), (userSnap) => {
        onValue(ref(db, 'contactMessages'), (visitorSnap) => {
            const userQueries = userSnap.val() || {};
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

            allQueries.sort((a, b) => b.timestamp - a.timestamp);
            renderQueries(allQueries);
        });
    });
}

function renderQueries(queries) {
    queriesContainer.innerHTML = queries.length === 0
        ? '<div class="py-6 text-center text-gray-400"><i class="fas fa-comment-dots text-3xl mb-2"></i><p>No queries yet</p></div>'
        : queries.map(q => `
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-semibold text-gray-800">${q.subject || q.message.substring(0, 30)}</h4>
                        <p class="text-xs text-gray-400">
                            ${q.type === 'visitor' ? `🌐 ${q.name} (${q.email})` : '👤 Registered User'} · ${new Date(q.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <span class="status-pill ${q.status === 'Open' || q.status === 'Unread' ? 'status-pending' : 'status-confirmed'}">${q.status}</span>
                </div>
                <p class="text-sm text-gray-600 mb-4">${q.message}</p>
                <div class="flex gap-3 items-center">
                    <button class="reply-btn text-teal-600 text-sm font-semibold" data-id="${q.id}" data-type="${q.type}" data-userid="${q.userId || ''}">
                        <i class="fas fa-reply mr-1"></i> Reply
                    </button>
                    <select class="changeStatus text-xs border border-gray-200 rounded-lg p-2 focus:ring-teal-500" data-id="${q.id}" data-type="${q.type}" data-userid="${q.userId || ''}">
                        <option value="">Update Status</option>
                        <option value="Open">Open</option>
                        <option value="Resolved">Resolved</option>
                    </select>
                    <button class="delete-query text-red-400 hover:text-red-600 text-sm" data-id="${q.id}" data-type="${q.type}" data-userid="${q.userId || ''}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="reply-form hidden mt-3" data-id="${q.id}">
                    <textarea class="w-full p-2 border rounded-xl text-sm" rows="2" placeholder="Write a reply..."></textarea>
                    <div class="flex justify-end gap-2 mt-2">
                        <button class="cancel-reply text-xs text-gray-500">Cancel</button>
                        <button class="send-reply text-xs bg-teal-600 text-white px-3 py-1 rounded-lg">Send</button>
                    </div>
                </div>
            </div>
        `).join('');

    // Reply actions
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const form = document.querySelector(`.reply-form[data-id="${id}"]`);
            if (form) form.classList.toggle('hidden');
        });
    });

    document.querySelectorAll('.send-reply').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const form = e.target.closest('.reply-form');
            const id = form.dataset.id;
            const type = form.closest('.bg-white').querySelector('.reply-btn').dataset.type;
            const userId = form.closest('.bg-white').querySelector('.reply-btn').dataset.userid;
            const replyText = form.querySelector('textarea').value.trim();
            if (!replyText) return;

            const nodePath = type === 'user' ? `queries/${userId}/${id}` : `contactMessages/${id}`;
            update(ref(db, nodePath), { reply: replyText, status: 'Resolved' })
                .then(() => {
                    form.querySelector('textarea').value = '';
                    form.classList.add('hidden');
                })
                .catch(err => alert('Error: ' + err.message));
        });
    });

    document.querySelectorAll('.cancel-reply').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.reply-form').classList.add('hidden'));
    });

    // Status change
    document.querySelectorAll('.changeStatus').forEach(select => {
        select.addEventListener('change', (e) => {
            const status = e.target.value;
            if (!status) return;
            const id = select.dataset.id;
            const type = select.dataset.type;
            const userId = select.dataset.userid;
            const nodePath = type === 'user' ? `queries/${userId}/${id}` : `contactMessages/${id}`;
            update(ref(db, nodePath), { status }).catch(err => alert('Error: ' + err.message));
        });
    });

    // Delete
    document.querySelectorAll('.delete-query').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const type = btn.dataset.type;
            const userId = btn.dataset.userid;
            if (confirm('Delete this query permanently?')) {
                const nodePath = type === 'user' ? `queries/${userId}/${id}` : `contactMessages/${id}`;
                remove(ref(db, nodePath)).catch(err => alert('Error: ' + err.message));
            }
        });
    });
}

logoutBtn.addEventListener('click', () => signOut(auth).then(() => window.location.href = '/html/home.html'));