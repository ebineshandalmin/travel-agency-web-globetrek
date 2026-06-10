import { auth } from './firebase.js';

const DB_BASE = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';
const params = new URLSearchParams(window.location.search);
const destination = params.get('destination');

if (!destination) {
    document.body.innerHTML = '<div class="text-center mt-20 text-red-500">No destination specified.</div>';
    throw new Error('Missing destination parameter');
}

async function loadLocationDetails() {
    try {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
        // For public access, you might allow unauthenticated reads if Firebase rules permit.
        // Here we'll use auth token if logged in; otherwise, you'd need public rules.
        let url = `${DB_BASE}/locationDetails/${destination}.json`;
        if (token) url += `?auth=${token}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Location not found');
        const loc = await res.json();

        if (!loc) {
            document.getElementById('heroTitle').textContent = 'No info available';
            return;
        }

        // Hero
        document.getElementById('heroImage').src = loc.image || 'https://via.placeholder.com/1600x600';
        document.getElementById('heroTitle').textContent = loc.name || destination;
        document.getElementById('heroSelling').textContent = loc.sellingLine || '';

        // Basic
        document.getElementById('shortIntro').textContent = loc.shortIntro || '';

        // Lists
        const ulAttractions = document.getElementById('attractionsList');
        ulAttractions.innerHTML = '';
        if (loc.mainAttractions && Array.isArray(loc.mainAttractions)) {
            loc.mainAttractions.forEach(att => {
                const li = document.createElement('li');
                li.textContent = att;
                ulAttractions.appendChild(li);
            });
        }

        const ulActivities = document.getElementById('activitiesList');
        ulActivities.innerHTML = '';
        if (loc.activities && Array.isArray(loc.activities)) {
            loc.activities.forEach(act => {
                const li = document.createElement('li');
                li.textContent = act;
                ulActivities.appendChild(li);
            });
        }

        document.getElementById('bestTime').textContent = loc.bestTimeToVisit || '';
        document.getElementById('cultureExperience').textContent = loc.cultureExperience || '';
        document.getElementById('accessibility').textContent = loc.accessibility || '';
        document.getElementById('accommodation').textContent = loc.accommodation || '';
        document.getElementById('costBudget').textContent = loc.costBudget || '';
        document.getElementById('travelTips').textContent = loc.travelTips || '';
    } catch (err) {
        console.error(err);
        document.getElementById('heroTitle').textContent = 'Location not found';
        document.getElementById('heroSelling').textContent = 'Please check the destination name.';
    }
}

document.addEventListener('DOMContentLoaded', loadLocationDetails);

// Navbar scroll effect (reuse from home.js)
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});