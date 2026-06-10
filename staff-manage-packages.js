import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import Toast from "./toast.js";

const packagesTableBody = document.getElementById('packagesTableBody');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const packagesContainer = document.getElementById('packagesContainer');

const packageModal = document.getElementById('packageModal');
const modalTitle = document.getElementById('modalTitle');
const packageForm = document.getElementById('packageForm');
const packageIdInput = document.getElementById('packageId');
const packageTitleInput = document.getElementById('packageTitle');
const packageDestinationInput = document.getElementById('packageDestination');
const packageDescriptionInput = document.getElementById('packageDescription');
const packagePriceInput = document.getElementById('packagePrice');
const packageTagInput = document.getElementById('packageTag');
const packageImageInput = document.getElementById('packageImage');

const logoutBtn = document.getElementById('logoutBtn');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');

let currentEditId = null;
const DB_BASE_URL = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        if (user.email.endsWith('@staffgt.com') || user.email.endsWith('@admingt.com')) {
            document.getElementById('staffName').textContent = user.displayName || 'Staff';
            loadPackages();
        } else {
            window.location.href = '/customer.html';
        }
    }
});

async function loadPackages() {
    loadingIndicator?.classList.remove('hidden');
    errorMessage?.classList.add('hidden');
    packagesContainer?.classList.add('hidden');
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE_URL}/packages.json?auth=${token}`);
        if (!res.ok) throw new Error('Failed to fetch packages');
        const data = await res.json();
        loadingIndicator?.classList.add('hidden');
        if (!data) {
            packagesTableBody.innerHTML = '<tr><td colspan="6" class="py-10 text-center text-gray-400">No packages found.</td></tr>';
            packagesContainer?.classList.remove('hidden');
            return;
        }
        const packages = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
        renderTable(packages);
        packagesContainer?.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        loadingIndicator?.classList.add('hidden');
        errorMessage?.classList.remove('hidden');
    }
}

function renderTable(packages) {
    packagesTableBody.innerHTML = packages.map(pkg => `
        <tr class="hover:bg-gray-50 border-b border-gray-100">
            <td class="p-4"><img src="${pkg.image}" class="w-12 h-12 rounded-lg object-cover"></td>
            <td class="p-4 font-medium">${pkg.title}</td>
            <td class="p-4 text-gray-500">${pkg.destination}</td>
            <td class="p-4 font-semibold text-teal-700">$${Number(pkg.price).toLocaleString()}</td>
            <td class="p-4"><span class="bg-teal-50 text-teal-700 text-xs font-semibold px-2 py-1 rounded-full">${pkg.tag}</span></td>
            <td class="p-4 text-center">
                <div class="flex justify-center gap-3">
                    <button class="text-teal-600 hover:text-teal-800 edit-btn" data-id="${pkg.id}"><i class="fas fa-pen"></i></button>
                    <button class="text-red-500 hover:text-red-700 delete-btn" data-id="${pkg.id}"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => btn.onclick = () => openEditModal(btn.dataset.id));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.onclick = () => deletePackage(btn.dataset.id));
}

openAddModalBtn.addEventListener('click', () => {
    currentEditId = null;
    modalTitle.textContent = 'Add New Package';
    packageForm.reset();
    packageIdInput.value = '';
    packageModal.classList.remove('hidden');
});
closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

function closeModal() {
    packageModal.classList.add('hidden');
    packageForm.reset();
    currentEditId = null;
}

async function openEditModal(id) {
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE_URL}/packages/${id}.json?auth=${token}`);
        const pkg = await res.json();
        if (!pkg) return;
        currentEditId = id;
        modalTitle.textContent = 'Edit Package';
        packageTitleInput.value = pkg.title || '';
        packageDestinationInput.value = pkg.destination || '';
        packageDescriptionInput.value = pkg.description || '';
        packagePriceInput.value = pkg.price || '';
        packageTagInput.value = pkg.tag || 'Adventure';
        packageImageInput.value = pkg.image || '';
        packageIdInput.value = id;
        packageModal.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        Toast.show('Could not load package details.', 'error');
    }
}

packageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const finalData = {
        title: String(packageTitleInput.value).trim(),
        destination: String(packageDestinationInput.value).trim(),
        description: String(packageDescriptionInput.value).trim(),
        price: Number(packagePriceInput.value),
        tag: String(packageTagInput.value),
        image: String(packageImageInput.value).trim()
    };
    try {
        const token = await auth.currentUser.getIdToken();
        if (currentEditId) {
            await fetch(`${DB_BASE_URL}/packages/${currentEditId}.json?auth=${token}`, {
                method: 'PUT', body: JSON.stringify(finalData)
            });
            Toast.show('Package updated', 'success');
        } else {
            await fetch(`${DB_BASE_URL}/packages.json?auth=${token}`, {
                method: 'POST', body: JSON.stringify(finalData)
            });
            Toast.show('Package created', 'success');
        }
        closeModal();
        loadPackages();
    } catch (err) {
        console.error(err);
        Toast.show('Save failed', 'error');
    }
});

async function deletePackage(id) {
    if (!confirm('Delete this package?')) return;
    try {
        const token = await auth.currentUser.getIdToken();
        await fetch(`${DB_BASE_URL}/packages/${id}.json?auth=${token}`, { method: 'DELETE' });
        Toast.show('Package deleted', 'success');
        loadPackages();
    } catch (err) {
        console.error(err);
        Toast.show('Delete failed', 'error');
    }
}

logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});