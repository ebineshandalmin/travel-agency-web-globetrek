import { auth, db } from "./firebase.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import Toast from "./toast.js";

// ---------- NAVIGATION BUTTONS ----------
document.getElementById("loginBtn")?.addEventListener("click", () => window.location.href = "/html/login.html");
document.getElementById("registerBtn")?.addEventListener("click", () => window.location.href = "/html/register.html");

// ---------- HERO SEARCH ----------
const heroSearchBtn = document.getElementById("heroSearchBtn");
const searchResults = document.getElementById("searchResults");
heroSearchBtn?.addEventListener("click", async () => {
  const query = document.getElementById("locationSearch").value.trim().toLowerCase();
  if (!query) return;
  const snapshot = await get(ref(db, "packages"));
  searchResults.innerHTML = "";
  searchResults.classList.remove("hidden");
  let found = false;
  snapshot.forEach((child) => {
    const data = child.val();
    if (data.destination.toLowerCase().includes(query) || data.title.toLowerCase().includes(query)) {
      found = true;
      // Search result click → open location guide with destination name
      searchResults.innerHTML += `<div class="p-4 border-b hover:bg-gray-50 cursor-pointer flex gap-4" 
          onclick="window.location.href='/html/location.html?destination=${encodeURIComponent(data.destination)}'">
        <img src="${data.image}" class="w-16 h-16 rounded-xl object-cover">
        <div>
          <h4 class="font-bold text-gray-800">${data.title}</h4>
          <p class="text-sm text-gray-500">${data.destination}</p>
          <span class="text-teal-600 text-xs font-semibold">From $${data.price}</span>
        </div>
      </div>`;
    }
  });
  if (!found) {
    searchResults.innerHTML = '<div class="p-4 text-center text-gray-500">No destinations found</div>';
    Toast.show("No matching destinations", "info");
  }
});
document.addEventListener("click", (e) => {
  if (!e.target.closest("#locationSearch") && !e.target.closest("#searchResults")) searchResults?.classList.add("hidden");
});

// ---------- HELPER ----------
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- CURATED COLLECTIONS – now 6 random cards, no click, no button ----------
async function loadRandomPackages() {
  const collectionsGrid = document.getElementById("collectionsGrid");
  if (!collectionsGrid) return;

  try {
    const snapshot = await get(ref(db, "packages"));
    if (snapshot.exists()) {
      const allPackages = [];
      snapshot.forEach((child) => {
        allPackages.push({ id: child.key, ...child.val() });
      });

      if (allPackages.length === 0) {
        collectionsGrid.innerHTML = '<p class="col-span-3 text-center text-gray-500">No packages available.</p>';
        return;
      }

      // Shuffle and take up to 6 – if fewer, show all
      const shuffled = shuffleArray([...allPackages]);
      const selected = shuffled.slice(0, 6);   // ✅ changed from 3 to 6

      collectionsGrid.innerHTML = selected.map(pkg => `
        <!-- Collection card (static, no click) -->
        <div class="collection-card group">
          <div class="img-container h-64">
            <img src="${pkg.image}" class="w-full h-full object-cover" alt="${pkg.title}">
            <div class="price-badge shadow-sm">$${pkg.price}</div>
          </div>
          <div class="p-6">
            <span class="bg-teal-50 text-teal-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full border border-teal-100">${pkg.tag}</span>
            <h3 class="text-xl font-bold text-gray-800 mt-2 group-hover:text-teal-700 transition-colors">${pkg.title}</h3>
            <p class="text-sm text-gray-500 mt-2 flex items-center">
              <i class="fas fa-map-marker-alt mr-2 text-teal-500"></i>${pkg.destination}
            </p>
            <!-- "Explore More" button completely removed -->
          </div>
        </div>
      `).join('');
    } else {
      collectionsGrid.innerHTML = '<p class="col-span-3 text-center text-gray-500">No packages found in database.</p>';
    }
  } catch (err) {
    console.error(err);
    collectionsGrid.innerHTML = '<p class="col-span-3 text-center text-gray-500">Failed to load collections.</p>';
  }
}

// ---------- NAVBAR SCROLL EFFECT ----------
window.addEventListener("scroll", () => {
  const nav = document.getElementById("navbar");
  if (nav) nav.classList.toggle("scrolled", window.scrollY > 50);
});

// ---------- INITIAL LOAD + AUTO‑REFRESH ----------
document.addEventListener('DOMContentLoaded', () => {
  loadRandomPackages();
  setInterval(loadRandomPackages, 10000);
});