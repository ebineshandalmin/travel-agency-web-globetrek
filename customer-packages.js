import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const DB_BASE = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';
let allPackages = [];

const searchInput = document.getElementById('searchInput');
const priceFilter = document.getElementById('priceFilter');
const tagFilter = document.getElementById('tagFilter');
const resetBtn = document.getElementById('resetFilters');

if (resetBtn) {
    resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        priceFilter.value = 'all';
        tagFilter.value = 'all';
        applyFilters();
    });
}

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        loadPackages(user);
    }
});

async function loadPackages(user) {
    const loading = document.getElementById('loadingIndicator');
    const error = document.getElementById('errorMessage');
    const grid = document.getElementById('packagesGrid');
    try {
        loading.classList.remove('hidden');
        error.classList.add('hidden');
        const token = await user.getIdToken();
        const res = await fetch(`${DB_BASE}/packages.json?auth=${token}`);
        if (!res.ok) throw new Error('Database access denied');
        const data = await res.json();
        loading.classList.add('hidden');
        if (!data) {
            grid.innerHTML = '<p class="col-span-full text-center text-gray-400">No packages found.</p>';
            return;
        }
        allPackages = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
        applyFilters();
    } catch (err) {
        console.error(err);
        loading.classList.add('hidden');
        error.classList.remove('hidden');
    }
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const priceRange = priceFilter.value;
    const tagValue = tagFilter.value;
    let filtered = [...allPackages];
    if (searchTerm) {
        filtered = filtered.filter(pkg =>
            (pkg.destination && pkg.destination.toLowerCase().includes(searchTerm)) ||
            (pkg.title && pkg.title.toLowerCase().includes(searchTerm))
        );
    }
    if (priceRange !== 'all') {
        filtered = filtered.filter(pkg => {
            const price = Number(pkg.price) || 0;
            if (priceRange === 'budget') return price < 1000;
            if (priceRange === 'mid') return price >= 1000 && price < 2000;
            if (priceRange === 'luxury') return price >= 2000;
            return true;
        });
    }
    if (tagValue !== 'all') {
        filtered = filtered.filter(pkg => pkg.tag === tagValue);
    }
    renderCards(filtered);
}

function renderCards(packages) {
    const grid = document.getElementById('packagesGrid');
    const noResults = document.getElementById('noResults');
    if (packages.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }
    noResults.classList.add('hidden');
    grid.innerHTML = packages.map(pkg => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition transform hover:-translate-y-1">
            <div class="h-48 overflow-hidden">
                <img src="${pkg.image}" alt="${pkg.title}" class="w-full h-full object-cover">
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-800">${pkg.title}</h3>
                    <span class="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-1 rounded-full">${pkg.tag}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3 line-clamp-2">${pkg.description || 'No description available'}</p>
                <div class="flex items-center justify-between mb-3">
                    <div>
                        <span class="text-xs text-gray-400 uppercase">${pkg.destination}</span>
                        <p class="text-2xl font-bold text-teal-700">$${Number(pkg.price).toLocaleString()}</p>
                    </div>
                </div>
                <div class="space-y-2">
                    <a href="/html/booking.html?packageId=${pkg.id}"
                       class="block w-full text-center bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl shadow-sm transition">
                        Book Now
                    </a>
                    <a href="/html/location.html?destination=${encodeURIComponent(pkg.destination)}"
                       class="block w-full text-center text-teal-600 text-sm font-semibold hover:text-teal-800 transition">
                        <i class="fas fa-map-marked-alt mr-1"></i> Location Guide
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

[searchInput, priceFilter, tagFilter].forEach(el => {
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = '/html/home.html');
});