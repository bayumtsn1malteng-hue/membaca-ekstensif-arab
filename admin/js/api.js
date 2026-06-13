/**
 * MODUL KOMUNIKASI API & SINKRONISASI
 * Versi: v0.5.0-alpha.2
 * ID Unik: MEB-ADMIN-API-001
 * * Modul ini menangani pengiriman data (POST) dan penarikan data (GET) 
 * ke Google Apps Script serta pengelolaan status koneksi (Local vs Live).
 */

/**
 * Mengirim data pembaruan ke Google Apps Script secara real-time
 * @param {string} action - Nama aksi (misal: 'saveText', 'saveVocab', dll)
 * @param {Object} payload - Data yang dikirimkan
 * @returns {Promise<boolean>} Status keberhasilan pengiriman
 */
async function postDataToBackend(action, payload) {
  if (connectionMode === "local") return true;

  const url = document.getElementById("api-script-url").value.trim();
  if (!url) {
    showToast("Peringatan: Mode Live Aktif namun URL Apps Script Kosong.", "warning");
    return false;
  }

  const indicator = document.getElementById("sync-status-indicator");
  indicator.classList.remove("hidden");

  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: action, data: payload })
    });
    
    showToast("Mengirim pembaruan realtime ke Sheets...", "info");
    setTimeout(() => {
      syncDatabaseLive();
    }, 1500);

    return true;
  } catch (err) {
    console.error("[API Error]", err);
    showToast("Gagal menyimpan realtime ke Google Sheets. Disimpan lokal.", "error");
    return false;
  } finally {
    indicator.classList.add("hidden");
  }
}

/**
 * Mengubah mode koneksi antara simulasi lokal dan Google Sheets Live
 * @param {string} mode - 'local' atau 'live'
 * @param {boolean} showNotification - Apakah menampilkan notifikasi toast
 */
function toggleConnectionMode(mode, showNotification = true) {
  connectionMode = mode;
  localStorage.setItem(DB_KEYS.CONNECTION_MODE, mode);

  const btnLocal = document.getElementById("btn-mode-local");
  const btnLive = document.getElementById("btn-mode-live");
  const apiPanel = document.getElementById("api-url-panel");

  if (mode === "local") {
    btnLocal.className = "px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-150 bg-white text-slate-800 shadow-xs";
    btnLive.className = "px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-150 text-slate-500 hover:text-slate-800";
    apiPanel.classList.add("opacity-50", "pointer-events-none");
    if (showNotification) showToast("Beralih ke Mode Simulasi (Local Storage)", "info");
  } else {
    btnLive.className = "px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-150 bg-white text-slate-800 shadow-xs";
    btnLocal.className = "px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-150 text-slate-500 hover:text-slate-800";
    apiPanel.classList.remove("opacity-50", "pointer-events-none");
    if (showNotification) showToast("Beralih ke Mode Live Google Sheets", "warning");
    
    const currentUrl = document.getElementById("api-script-url").value.trim();
    localStorage.setItem(DB_KEYS.API_URL, currentUrl);
  }
}

/**
 * Menarik data terbaru dari Spreadsheet (Database Live) ke Penyimpanan Lokal
 */
async function syncDatabaseLive() {
  const url = document.getElementById("api-script-url").value.trim();
  if (!url) {
    showToast("Masukkan URL Google Apps Script terlebih dahulu!", "error");
    return;
  }
  
  localStorage.setItem(DB_KEYS.API_URL, url);
  const btn = document.getElementById("btn-sync-live");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin inline-block w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full mr-1.5"></span><span>Memuat...</span>`;

  try {
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.status === "success") {
      updateLocalCacheFromBackend(result.data);
      showToast("Database berhasil disinkronkan dari Google Sheets!", "success");
    } else {
      showToast("Gagal menarik data: " + result.message, "error");
    }
  } catch (err) {
    console.error("[Sync Error]", err);
    showToast("Koneksi gagal! Periksa URL Apps Script & Otorisasi akses.", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/**
 * Memperbarui cache LocalStorage berdasarkan data live yang ditarik dari Apps Script
 * @param {Object} payload - Objek berisi array data pustaka, kosakata, dll
 */
function updateLocalCacheFromBackend(payload) {
  dbPustaka = payload.pustaka || [];
  dbPetaKosakata = payload.peta_kosakata || [];
  dbKataInduk = payload.kata_induk || [];
  dbMasterSambungan = payload.sambungan || [];

  saveToLocalStorage(DB_KEYS.PUSTAKA, dbPustaka);
  saveToLocalStorage(DB_KEYS.KOSAKATA, dbPetaKosakata);
  saveToLocalStorage(DB_KEYS.KATA_INDUK, dbKataInduk);
  saveToLocalStorage(DB_KEYS.SAMBUNGAN, dbMasterSambungan);

  if (dbPustaka.length > 0) {
    loadSelectedTextIntoState(dbPustaka[0]);
  }
  renderPustakaTable();
  renderQueueTable();
  updateQueueBadge();
}