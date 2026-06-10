import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const queriesContainer = document.getElementById('queriesContainer');
const logoutBtn = document.getElementById('logoutBtn');

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        document.getElementById('adminName').textContent = user.displayName || 'Admin User';
        loadQueries();
    }
});

function loadQueries() {
    onValue(ref(db, 'queries'), (userQueriesSnap) => {
        onValue(ref(db, 'contactMessages'), (visitorSnap) => {
            const userQueries = userQueriesSnap.val() || {};
            const visitorQueries = visitorSnap.val() || {};
            const allQueries = [];

            // Registered user queries
            Object.keys(userQueries).forEach(userId => {
                Object.entries(userQueries[userId]).forEach(([qId, q]) => {
                    allQueries.push({
                        id: qId,
                        userId,
                        type: 'user',
                        name: `User ${userId.substring(0,6)}`, // could be enriched with users node if needed
                        email: '', // not stored per query
                        subject: q.subject || '(no subject)',
                        message: q.message,
                        timestamp: q.timestamp,
                        status: q.status || 'Open',
                        reply: q.reply || ''
                    });
                });
            });

            // Visitor messages
            Object.entries(visitorQueries).forEach(([id, msg]) => {
                allQueries.push({
                    id,
                    type: 'visitor',
                    name: msg.name || 'Visitor',
                    email: msg.email || '',
                    subject: msg.subject || '(no subject)',
                    message: msg.message,
                    timestamp: msg.timestamp,
                    status: msg.status || 'Unread',
                    reply: msg.reply || ''
                });
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
                        <h4 class="font-semibold text-gray-800">${q.subject}</h4>
                        <p class="text-xs text-gray-400">
                            ${q.type === 'user' ? '👤 Registered User' : '🌐 Visitor'} • ${q.name}${q.email ? ` (${q.email})` : ''} • ${new Date(q.timestamp).toLocaleString()}
                        </p>
                    </div>
                    <span class="status-pill ${q.status === 'Open' || q.status === 'Unread' ? 'status-pending' : 'status-confirmed'}">${q.status}</span>
                </div>
                <p class="text-sm text-gray-600 mb-4">${q.message}</p>
                ${q.reply ? `<div class="bg-teal-50 p-3 rounded-xl text-sm text-teal-800 mb-3"><strong>Reply:</strong> ${q.reply}</div>` : ''}
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
                <!-- Reply form (hidden initially) -->
                <div class="reply-form hidden mt-3" data-id="${q.id}">
                    <textarea class="w-full p-2 border rounded-xl text-sm" rows="2" placeholder="Write a reply..."></textarea>
                    <div class="flex justify-end gap-2 mt-2">
                        <button class="cancel-reply text-xs text-gray-500">Cancel</button>
                        <button class="send-reply text-xs bg-teal-600 text-white px-3 py-1 rounded-lg">Send</button>
                    </div>
                </div>
            </div>
        `).join('');

    // Reply button handlers
    document.querySelectorAll('.reply-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const form = document.querySelector(`.reply-form[data-id="${id}"]`);
            if (form) form.classList.toggle('hidden');
        });
    });

    // Send reply
    document.querySelectorAll('.send-reply').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const form = e.target.closest('.reply-form');
            const id = form.dataset.id;
            const type = form.closest('.bg-white').querySelector('.reply-btn').dataset.type;
            const userId = form.closest('.bg-white').querySelector('.reply-btn').dataset.userid;
            const message = form.querySelector('textarea').value.trim();
            if (!message) return;

            const nodePath = type === 'user' ? `queries/${userId}/${id}` : `contactMessages/${id}`;
            update(ref(db, nodePath), { reply: message, status: 'Resolved' })
                .then(() => {
                    form.querySelector('textarea').value = '';
                    form.classList.add('hidden');
                })
                .catch(err => alert('Error: ' + err.message));
        });
    });

    document.querySelectorAll('.cancel-reply').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.reply-form').classList.add('hidden');
        });
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
            update(ref(db, nodePath), { status })
                .catch(err => alert('Error: ' + err.message));
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
                remove(ref(db, nodePath))
                    .catch(err => alert('Error: ' + err.message));
            }
        });
    });
}

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});