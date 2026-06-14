/**
 * SHARED UI UTILS
 * Fungsi manipulasi DOM yang digunakan oleh User dan Admin.
 */

function showModal(title, message, iconClass = "fa-solid fa-circle-check text-emerald-500") {
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalBodyIcon = document.getElementById('modal-body')?.querySelector('i');
  const modalContainer = document.getElementById('custom-modal');

  if (modalTitle) modalTitle.textContent = title;
  if (modalMessage) modalMessage.textContent = message;
  if (modalBodyIcon) modalBodyIcon.className = `${iconClass} text-4xl mb-3`;
  if (modalContainer) modalContainer.classList.remove('hidden');
}

function showSpinnerButton(btnId, show, originalText = "") {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (show) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin mr-2"></i> Memproses...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  saveToLocalStorage('dark_mode', isDark);
  const iconClass = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  
  const sidebarIcon = document.getElementById('theme-icon-sidebar');
  const mobileIcon = document.getElementById('theme-icon-mobile');
  const headerIcon = document.getElementById('theme-icon-mobile'); // Menyesuaikan ID di index.html

  if (sidebarIcon) sidebarIcon.className = iconClass;
  if (mobileIcon) mobileIcon.className = iconClass;
}

/**
 * Mengambil data dari LocalStorage dengan nilai default jika kosong.
 */
function getFromLocalStorage(key, defaultValue) {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    // Jika gagal parse (berarti data lama/teks polos), 
    // kembalikan data apa adanya dan bungkus ulang ke JSON agar kedepannya aman.
    console.warn(`[Storage] Gagal parsing JSON untuk kunci "${key}", menggunakan fallback teks polos.`);
    localStorage.setItem(key, JSON.stringify(data));
    return data;
  }
}

/**
 * Menyimpan data ke LocalStorage dalam format JSON.
 */
function saveToLocalStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Memunculkan pesan melayang (Toast Notification) di layar
 */
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `flex items-center space-x-2.5 px-4 py-3 rounded-xl border shadow-lg text-xs font-semibold bg-white transition duration-300 transform translate-x-20 opacity-0 pointer-events-auto`;
  
  let colorClass = "text-emerald-700 border-emerald-100 bg-emerald-50";
  if (type === "warning") colorClass = "text-amber-700 border-amber-100 bg-amber-50";
  if (type === "error") colorClass = "text-rose-700 border-rose-100 bg-rose-50";
  if (type === "info") colorClass = "text-indigo-700 border-indigo-100 bg-indigo-50";

  toast.className += ` ${colorClass}`;
  toast.innerHTML = `<span>${message}</span>`;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove("translate-x-20", "opacity-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("translate-x-20", "opacity-0");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}