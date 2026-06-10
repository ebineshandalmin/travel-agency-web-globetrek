import { auth } from './firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import Toast from "./toast.js";

const DB_BASE = 'https://globe-trek-b1e87-default-rtdb.firebaseio.com';
const urlParams = new URLSearchParams(window.location.search);
const packageId = urlParams.get('packageId');
let packageData = null, currentUser = null;

const loadingEl = document.getElementById('loadingPackage'), errorEl = document.getElementById('errorPackage');
const bookingSection = document.getElementById('bookingSection'), confirmBtn = document.getElementById('confirmBookingBtn');
const successModal = document.getElementById('successModal'), receiptDetails = document.getElementById('receiptDetails');

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = '/html/login.html'; return; }
    currentUser = user;
    if (!packageId) return;
    await fetchPackage();
    attachEventListeners();
    updateSummary();                // initial calculation
});

async function fetchPackage() {
    try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch(`${DB_BASE}/packages/${packageId}.json?auth=${token}`);
        if (!res.ok) throw new Error('Package not found');
        packageData = await res.json();
        populatePackage();
        loadingEl.classList.add('hidden');
        bookingSection.classList.remove('hidden');
    } catch (err) { Toast.show("Failed to load package details", "error"); }
}

function calculateFinalTotal() {
    const adults = parseInt(document.getElementById('adults').value) || 0;
    const children = parseInt(document.getElementById('children').value) || 0;
    const base = Number(packageData.price) * (adults + children);
    const accExtra = parseInt(document.getElementById('accommodation').selectedOptions[0]?.dataset.extra) || 0;
    let addonTotal = 0;
    ['addonTransfer','addonInsurance','addonTour'].forEach(id => {
        const cb = document.getElementById(id);
        if (cb && cb.checked) addonTotal += parseInt(cb.dataset.price) || 0;
    });
    return base + accExtra + addonTotal;
}

function updateSummary() {
    const adults = parseInt(document.getElementById('adults').value) || 0;
    const children = parseInt(document.getElementById('children').value) || 0;
    const base = Number(packageData.price) * (adults + children);
    const accExtra = parseInt(document.getElementById('accommodation').selectedOptions[0]?.dataset.extra) || 0;
    let addonTotal = 0;
    ['addonTransfer','addonInsurance','addonTour'].forEach(id => {
        const cb = document.getElementById(id);
        if (cb && cb.checked) addonTotal += parseInt(cb.dataset.price) || 0;
    });
    const total = base + accExtra + addonTotal;

    document.getElementById('totalTravelers').textContent = adults + children;
    document.getElementById('summaryBase').textContent = `$${base.toLocaleString()}`;
    document.getElementById('summaryAccommodation').textContent = `$${accExtra.toLocaleString()}`;
    document.getElementById('summaryAddons').textContent = `$${addonTotal.toLocaleString()}`;
    document.getElementById('summaryTotal').textContent = `$${total.toLocaleString()}`;
    document.getElementById('btnTotal').textContent = `$${total.toLocaleString()}`;
}

confirmBtn.addEventListener('click', async () => {
    if (!packageData || !currentUser) return;
    const adults = parseInt(document.getElementById('adults').value)||0, children = parseInt(document.getElementById('children').value)||0;
    const totalPrice = calculateFinalTotal();
    const bookingData = {
        packageId, packageName: packageData.title, destination: packageData.destination, image: packageData.image,
        travelers: { adults, children },
        departureDate: document.getElementById('departureDate').value,
        returnDate: document.getElementById('returnDate').value,
        totalPrice, status: 'Pending', bookedAt: Date.now()
    };
    try {
        const token = await auth.currentUser.getIdToken();
        const bookingRes = await fetch(`${DB_BASE}/bookings/${currentUser.uid}.json?auth=${token}`, { method:'POST', body: JSON.stringify(bookingData) });
        const bookingId = (await bookingRes.json()).name;
        await fetch(`${DB_BASE}/agency_approvals/${bookingId}.json?auth=${token}`, { method:'PUT', body: JSON.stringify({...bookingData, userId: currentUser.uid, userEmail: currentUser.email, bookingId}) });
        await fetch(`${DB_BASE}/receipts/${bookingId}.json?auth=${token}`, { method:'PUT', body: JSON.stringify({bookingId, userId: currentUser.uid, transactionId: 'GT-'+Date.now().toString(36).toUpperCase(), ...bookingData}) });
        receiptDetails.innerHTML = `<p><strong>Status:</strong> <span class="text-amber-600 font-bold">Awaiting Approval</span></p><p><strong>Booking ID:</strong> ${bookingId}</p><p><strong>Package:</strong> ${packageData.title}</p><p><strong>Total Paid:</strong> $${totalPrice.toLocaleString()}</p>`;
        successModal.classList.remove('hidden');
        Toast.show("Booking submitted for approval", "success");
    } catch (err) { Toast.show("Booking failed. Please try again.", "error"); }
});

function populatePackage() {
    document.getElementById('pkgTitle').textContent = packageData.title;
    document.getElementById('pkgImage').src = packageData.image;
    document.getElementById('pkgBasePrice').textContent = `$${Number(packageData.price).toLocaleString()}`;
}

function attachEventListeners() {
    ['adults','children','accommodation','addonTransfer','addonInsurance','addonTour'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', updateSummary);
    });
}