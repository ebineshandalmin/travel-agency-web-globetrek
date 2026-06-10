import { auth, db } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const packageTableBody = document.getElementById('packageTableBody');
const packageForm = document.getElementById('packageForm');
const packageModal = document.getElementById('packageModal');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const addNewBtn = document.getElementById('addNewBtn');
const logoutBtn = document.getElementById('logoutBtn');
let editingId = null;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        document.getElementById('adminName').textContent = user.displayName || 'Admin User';
        loadPackages();
    }
});

function openModal(id = null) {
    packageModal.classList.remove('hidden');
    if (id) {
        modalTitle.textContent = 'Edit Package';
        onValue(ref(db, `packages/${id}`), (snap) => {
            const pkg = snap.val();
            if (pkg) {
                document.getElementById('packageId').value = id;
                document.getElementById('title').value = pkg.title || '';
                document.getElementById('destination').value = pkg.destination || '';
                document.getElementById('price').value = pkg.price || '';
                document.getElementById('duration').value = pkg.duration || '';
                document.getElementById('image').value = pkg.image || '';
                document.getElementById('description').value = pkg.description || '';
            }
        }, { onlyOnce: true });
        editingId = id;
    } else {
        modalTitle.textContent = 'Add New Package';
        packageForm.reset();
        document.getElementById('packageId').value = '';
        editingId = null;
    }
}

function closeModal() {
    packageModal.classList.add('hidden');
    editingId = null;
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

addNewBtn.addEventListener('click', () => openModal());

packageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pkgData = {
        title: document.getElementById('title').value,
        destination: document.getElementById('destination').value,
        price: Number(document.getElementById('price').value),
        duration: document.getElementById('duration').value,
        image: document.getElementById('image').value,
        description: document.getElementById('description').value
    };

    if (editingId) {
        update(ref(db, `packages/${editingId}`), pkgData)
            .then(() => closeModal())
            .catch(err => alert('Error: ' + err.message));
    } else {
        const newRef = push(ref(db, 'packages'));
        set(newRef, pkgData)
            .then(() => closeModal())
            .catch(err => alert('Error: ' + err.message));
    }
});

function loadPackages() {
    onValue(ref(db, 'packages'), (snapshot) => {
        const packages = snapshot.val() || {};
        packageTableBody.innerHTML = '';
        Object.entries(packages).forEach(([key, item]) => {
            packageTableBody.innerHTML += `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-4 flex items-center gap-3 font-semibold">
                        <img src="${item.image}" class="w-10 h-10 rounded-lg object-cover">
                        ${item.title}
                    </td>
                    <td class="py-4 text-gray-500">${item.destination}</td>
                    <td class="py-4 font-bold">$${item.price}</td>
                    <td class="py-4 text-gray-500">${item.duration}</td>
                    <td class="py-4">
                        <div class="flex justify-center gap-4 text-gray-400">
                            <button class="edit-btn hover:text-teal-600" data-id="${key}"><i class="fas fa-pen"></i></button>
                            <button class="delete-btn hover:text-red-500" data-id="${key}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                openModal(id);
            });
        });
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('Are you sure you want to remove this package?')) {
                    remove(ref(db, `packages/${id}`)).catch(err => alert('Error: ' + err.message));
                }
            });
        });
    });
}

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});