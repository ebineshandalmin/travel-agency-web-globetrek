import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const DB_BASE_URL = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';

// DOM Elements
const locationsContainer = document.getElementById('locationsContainer');
const loadingIndicator = document.getElementById('loadingIndicator');
const errorMessage = document.getElementById('errorMessage');
const locationModal = document.getElementById('locationModal');
const modalTitle = document.getElementById('modalTitle');
const locationForm = document.getElementById('locationForm');
const locationKeyHidden = document.getElementById('locationKey');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const logoutBtn = document.getElementById('logoutBtn');

const destinationSelect = document.getElementById('destinationSelect');
const customDestName = document.getElementById('customDestName');

const addAttractionBtn = document.getElementById('addAttractionBtn');
const addActivityBtn = document.getElementById('addActivityBtn');
const attractionsContainer = document.getElementById('attractionsContainer');
const activitiesContainer = document.getElementById('activitiesContainer');

let currentEditKey = null;
let packagesDestMap = {}; // title -> destination

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/html/login.html';
    } else {
        if (user.email.endsWith('@staffgt.com') || user.email.endsWith('@admingt.com')) {
            document.getElementById('staffName').textContent = user.displayName || 'Staff';
            loadLocations();
        } else {
            window.location.href = '/customer.html';
        }
    }
});

async function loadLocations() {
    loadingIndicator.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    locationsContainer.classList.add('hidden');
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE_URL}/locationDetails.json?auth=${token}`);
        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        loadingIndicator.classList.add('hidden');
        if (!data) {
            locationsContainer.innerHTML = '<div class="col-span-full text-center text-gray-400 py-10">No location details yet. Add your first destination!</div>';
            locationsContainer.classList.remove('hidden');
            return;
        }
        const locations = Object.entries(data).map(([key, val]) => ({ key, ...val }));
        renderCards(locations);
        locationsContainer.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        loadingIndicator.classList.add('hidden');
        errorMessage.classList.remove('hidden');
    }
}

function renderCards(locations) {
    locationsContainer.innerHTML = locations.map(loc => `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <img src="${loc.image || 'https://via.placeholder.com/400x200'}" alt="${loc.name}" class="w-full h-40 object-cover rounded-xl mb-4">
            <h3 class="text-xl font-bold text-gray-800">${loc.name}</h3>
            <p class="text-sm text-gray-500 mb-1">${loc.country || ''}</p>
            <p class="text-xs text-gray-400 italic flex-1">${loc.sellingLine || ''}</p>
            <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button class="text-teal-600 hover:text-teal-800 edit-btn" data-key="${loc.key}"><i class="fas fa-pen"></i></button>
                <button class="text-red-500 hover:text-red-700 delete-btn" data-key="${loc.key}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => openEditModal(btn.dataset.key)));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => deleteLocation(btn.dataset.key)));
}

// ---------- LOAD PACKAGES & BUILD DROPDOWN (Title + Destination) ----------
async function loadDestinationsIntoSelect() {
    destinationSelect.innerHTML = '<option value="">-- Select a package --</option>';
    packagesDestMap = {};
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE_URL}/packages.json?auth=${token}`);
        const data = await res.json();
        if (data) {
            Object.values(data).forEach(pkg => {
                const dest = pkg.destination;
                const title = pkg.title;
                if (!dest) return;
                // Avoid duplicate entries for the same destination
                if (!packagesDestMap[dest]) {
                    packagesDestMap[dest] = title;
                    const option = document.createElement('option');
                    option.value = dest;                       // key = destination
                    option.textContent = `${title} (${dest})`; // display = Title (Destination)
                    destinationSelect.appendChild(option);
                }
            });
        }
        const otherOption = document.createElement('option');
        otherOption.value = '__other__';
        otherOption.textContent = 'Other (new destination)';
        destinationSelect.appendChild(otherOption);
    } catch (err) {
        console.error('Failed to load packages', err);
    }
}

destinationSelect.addEventListener('change', () => {
    if (destinationSelect.value === '__other__') {
        customDestName.classList.remove('hidden');
        customDestName.setAttribute('required', 'required');
    } else {
        customDestName.classList.add('hidden');
        customDestName.removeAttribute('required');
        customDestName.value = '';
    }
});

openAddModalBtn.addEventListener('click', async () => {
    currentEditKey = null;
    modalTitle.textContent = 'Add New Location';
    locationForm.reset();
    locationKeyHidden.value = '';
    clearRepeatableFields();
    destinationSelect.value = '';
    customDestName.classList.add('hidden');
    destinationSelect.disabled = false;
    await loadDestinationsIntoSelect();
    locationModal.classList.remove('hidden');
});

function closeModal() {
    locationModal.classList.add('hidden');
    locationForm.reset();
    destinationSelect.disabled = false;
    currentEditKey = null;
}

closeModalBtn.addEventListener('click', closeModal);
cancelModalBtn.addEventListener('click', closeModal);

// ---------- REPEATABLE FIELDS ----------
addAttractionBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'attraction-input w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 mb-2';
    input.placeholder = 'Add another attraction';
    attractionsContainer.appendChild(input);
});
addActivityBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'activity-input w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 mb-2';
    input.placeholder = 'Add another activity';
    activitiesContainer.appendChild(input);
});
function clearRepeatableFields() {
    const attractionInputs = document.querySelectorAll('.attraction-input');
    const activityInputs = document.querySelectorAll('.activity-input');
    attractionInputs.forEach((inp, idx) => { if (idx > 0) inp.remove(); });
    activityInputs.forEach((inp, idx) => { if (idx > 0) inp.remove(); });
    if (attractionInputs[0]) attractionInputs[0].value = '';
    if (activityInputs[0]) activityInputs[0].value = '';
}
function getRepeatableValues(containerClass) {
    return Array.from(document.querySelectorAll(`.${containerClass}`))
                .map(inp => inp.value.trim())
                .filter(v => v.length > 0);
}

// ---------- EDIT ----------
async function openEditModal(key) {
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE_URL}/locationDetails/${key}.json?auth=${token}`);
        const loc = await res.json();
        if (!loc) return;

        currentEditKey = key;
        modalTitle.textContent = 'Edit Location';
        locationKeyHidden.value = key;

        await loadDestinationsIntoSelect();
        // Select the correct destination from dropdown
        let found = false;
        for (let opt of destinationSelect.options) {
            if (opt.value === key) {
                destinationSelect.value = key;
                found = true;
                break;
            }
        }
        if (!found) {
            // If the key (destination) isn't in packages, add it manually
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${loc.name || key} (custom)`;
            destinationSelect.appendChild(option);
            destinationSelect.value = key;
        }
        destinationSelect.disabled = true;
        customDestName.classList.add('hidden');

        document.getElementById('locCountry').value = loc.country || '';
        document.getElementById('locShortIntro').value = loc.shortIntro || '';
        document.getElementById('locBestTime').value = loc.bestTimeToVisit || '';
        document.getElementById('locCulture').value = loc.cultureExperience || '';
        document.getElementById('locAccessibility').value = loc.accessibility || '';
        document.getElementById('locAccommodation').value = loc.accommodation || '';
        document.getElementById('locCostBudget').value = loc.costBudget || '';
        document.getElementById('locTravelTips').value = loc.travelTips || '';
        document.getElementById('locSellingLine').value = loc.sellingLine || '';
        document.getElementById('locImage').value = loc.image || '';

        clearRepeatableFields();
        const firstAttraction = document.querySelector('.attraction-input');
        const firstActivity = document.querySelector('.activity-input');
        if (loc.mainAttractions && Array.isArray(loc.mainAttractions)) {
            firstAttraction.value = loc.mainAttractions[0] || '';
            loc.mainAttractions.slice(1).forEach(att => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'attraction-input w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 mb-2';
                input.value = att;
                attractionsContainer.appendChild(input);
            });
        } else if (firstAttraction) firstAttraction.value = '';
        if (loc.activities && Array.isArray(loc.activities)) {
            firstActivity.value = loc.activities[0] || '';
            loc.activities.slice(1).forEach(act => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'activity-input w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 mb-2';
                input.value = act;
                activitiesContainer.appendChild(input);
            });
        } else if (firstActivity) firstActivity.value = '';

        locationModal.classList.remove('hidden');
    } catch (err) {
        console.error(err);
        alert('Could not load location details.');
    }
}

// ---------- SAVE ----------
locationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    let destinationKey, destinationName;

    if (currentEditKey) {
        destinationKey = currentEditKey;
        destinationName = destinationSelect.value; // key is the destination name
    } else {
        if (destinationSelect.value === '__other__') {
            const customName = customDestName.value.trim();
            if (!customName) { alert('Please enter a destination name.'); return; }
            destinationKey = customName;
            destinationName = customName;
        } else if (destinationSelect.value) {
            destinationKey = destinationSelect.value;
            destinationName = destinationSelect.value;
        } else {
            alert('Please select a package/destination.'); return;
        }
    }

    const locData = {
        name: destinationName,
        country: document.getElementById('locCountry').value.trim(),
        shortIntro: document.getElementById('locShortIntro').value.trim(),
        mainAttractions: getRepeatableValues('attraction-input'),
        activities: getRepeatableValues('activity-input'),
        bestTimeToVisit: document.getElementById('locBestTime').value.trim(),
        cultureExperience: document.getElementById('locCulture').value.trim(),
        accessibility: document.getElementById('locAccessibility').value.trim(),
        accommodation: document.getElementById('locAccommodation').value.trim(),
        costBudget: document.getElementById('locCostBudget').value.trim(),
        travelTips: document.getElementById('locTravelTips').value.trim(),
        sellingLine: document.getElementById('locSellingLine').value.trim(),
        image: document.getElementById('locImage').value.trim()
    };

    try {
        const token = await auth.currentUser.getIdToken();
        const url = `${DB_BASE_URL}/locationDetails/${destinationKey}.json?auth=${token}`;
        const res = await fetch(url, { method: 'PUT', body: JSON.stringify(locData) });
        if (!res.ok) throw new Error('Save failed');
        closeModal();
        loadLocations();
    } catch (err) {
        alert('Failed to save location.');
        console.error(err);
    }
});

async function deleteLocation(key) {
    if (!confirm('Delete this location?')) return;
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE_URL}/locationDetails/${key}.json?auth=${token}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        loadLocations();
    } catch (err) {
        console.error(err);
        alert('Failed to delete location.');
    }
}

logoutBtn.addEventListener('click', () => signOut(auth).then(() => window.location.href = '/html/home.html'));