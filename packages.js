// /script/packages.js

// Navbar scroll effect (transparent → solid)
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

import Toast from "./toast.js";
import { db } from './firebase.js';
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// ---------- DOM ELEMENTS ----------
const packagesGrid = document.getElementById('packagesGrid');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const noResults = document.getElementById('noResults');
const destinationFilter = document.getElementById('destinationFilter');
const priceFilter = document.getElementById('priceFilter');
const durationFilter = document.getElementById('durationFilter');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

let allPackages = [];

// ---------- PACKAGE LOADING (realtime) ----------
function loadPackages() {
    onValue(ref(db, 'packages'), (snapshot) => {
        if (snapshot.exists()) {
            allPackages = Object.entries(snapshot.val()).map(([key, value]) => ({
                id: key,
                ...value,
                duration: value.duration || 'N/A'
            }));
            applyFilters();
        } else {
            showError();
        }
    }, (error) => {
        console.error(error);
        showError();
    });
}

function showError() {
    loadingIndicator.classList.add('hidden');
    errorMessage.classList.remove('hidden');
    packagesGrid.classList.add('hidden');
    noResults.classList.add('hidden');
}

// ---------- APPLY FILTERS ----------
function applyFilters() {
    const destQuery = destinationFilter.value.toLowerCase().trim();
    const priceRange = priceFilter.value;
    const durationRange = durationFilter.value;
    let filtered = [...allPackages];

    // Destination search (in destination or title)
    if (destQuery) {
        filtered = filtered.filter(pkg =>
            pkg.destination.toLowerCase().includes(destQuery) ||
            pkg.title.toLowerCase().includes(destQuery)
        );
    }

    // Price range
    if (priceRange !== 'all') {
        filtered = filtered.filter(pkg => {
            const price = pkg.price;
            if (priceRange === 'budget') return price < 1000;
            if (priceRange === 'mid') return price >= 1000 && price < 2000;
            if (priceRange === 'luxury') return price >= 2000;
            return true;
        });
    }

    // Duration filter
    if (durationRange !== 'all') {
        filtered = filtered.filter(pkg => {
            const dur = pkg.duration;
            const days = (dur.match(/(\d+)\s*Days?/i) || [])[1] || 0;
            if (durationRange === 'short') return days >= 3 && days <= 5;
            if (durationRange === 'medium') return days >= 6 && days <= 8;
            if (durationRange === 'long') return days >= 9;
            return true;
        });
    }

    renderPackages(filtered);
}

// ---------- RENDER CARDS ----------
function renderPackages(packages) {
    loadingIndicator.classList.add('hidden');
    errorMessage.classList.add('hidden');
    if (packages.length === 0) {
        packagesGrid.classList.add('hidden');
        noResults.classList.remove('hidden');
        Toast.show("No packages match your filters", "info");
        return;
    }
    noResults.classList.add('hidden');
    packagesGrid.classList.remove('hidden');

    packagesGrid.innerHTML = packages.map(pkg => `
        <div class="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition transform hover:-translate-y-1 package-card">
            <div class="h-56 overflow-hidden">
                <img src="${pkg.image}" alt="${pkg.title}" class="w-full h-full object-cover">
            </div>
            <div class="p-5 flex flex-col">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-xl text-gray-800">${pkg.title}</h3>
                    <span class="bg-teal-100 text-teal-800 text-xs font-bold px-2 py-1 rounded-full">${pkg.tag || 'POPULAR'}</span>
                </div>
                <p class="text-sm text-gray-600 mb-4 line-clamp-3">${pkg.description || ''}</p>
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <span class="text-xs text-gray-400">STARTING FROM</span>
                        <p class="text-2xl font-bold text-teal-700">$${pkg.price.toLocaleString()}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-xs text-gray-400 block">${pkg.duration}</span>
                    </div>
                </div>

                <!-- Only the Location Guide button – View Details removed -->
                <div class="mt-auto">
                    <a href="/html/location.html?destination=${encodeURIComponent(pkg.destination)}"
                       class="block w-full text-center bg-teal-700 hover:bg-teal-800 text-white font-semibold py-2.5 rounded-xl transition shadow-sm">
                        <i class="fas fa-map-marked-alt mr-1"></i> Location Guide
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

// ---------- RESET FILTERS ----------
resetFiltersBtn.addEventListener('click', () => {
    destinationFilter.value = '';
    priceFilter.value = 'all';
    durationFilter.value = 'all';
    applyFilters();
});

// ---------- FILTER LISTENERS (real‑time) ----------
[destinationFilter, priceFilter, durationFilter].forEach(el => {
    el.addEventListener('input', applyFilters);
    el.addEventListener('change', applyFilters);
});

// ---------- INITIAL LOAD ----------
loadPackages();