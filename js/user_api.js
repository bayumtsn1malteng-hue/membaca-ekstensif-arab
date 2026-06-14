/**
 * MODUL KOMUNIKASI API (USER)
 * Versi: v0.5.5-alpha
 * ID Unik: MEB-USER-API-001
 * * Modul ini bertanggung jawab untuk semua interaksi dengan Google Apps Script (GAS) backend.
 */

/**
 * Menyimpan URL endpoint Google Apps Script ke localStorage.
 */
function saveApiEndpoint() {
  const url = document.getElementById('api-endpoint-url').value.trim();
  if (url === "") {
    appState.gasEndpoint = "";
    appState.isMockMode = true;
    saveToLocalStorage('meb_gas_endpoint', '');
    document.getElementById('connection-status-tag').textContent = "Mock Data (Offline Mode)";
    document.getElementById('connection-status-tag').className = "text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 uppercase tracking-wide";
    document.getElementById('btn-sync-manual').classList.add('hidden');
    showModal("Mode Offline Diaktifkan", "Endpoint kosong, sistem kembali menggunakan simulasi database browser.", "fa-solid fa-circle-info text-slate-500");
  } else if (url.startsWith("https://script.google.com/")) {
    appState.gasEndpoint = url;
    appState.isMockMode = false;
    saveToLocalStorage('meb_gas_endpoint', url);
    document.getElementById('connection-status-tag').textContent = "Sinkron Server Aktif";
    document.getElementById('connection-status-tag').className = "text-[10px] font-extrabold px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide";
    document.getElementById('btn-sync-manual').classList.remove('hidden');
    
    pullSystemDataFromServer();
    pullUserKamusFromServer();

    showModal("Endpoint Disimpan", "Koneksi Google Apps Script berhasil ditargetkan dan sinkronisasi dimulai.", "fa-solid fa-cloud-arrow-up text-teal-600");
  } else {
    showModal("Format URL Salah", "Gunakan URL Web App resmi Google Apps Script.", "fa-solid fa-triangle-exclamation text-rose-500");
  }
}

/**
 * Menguji koneksi ke Google Apps Script backend.
 */
async function testApiConnection() {
  if (appState.isMockMode || !appState.gasEndpoint) {
    showModal("Koneksi Batal", "Silakan atur URL Jembatan Integrasi di atas terlebih dahulu.", "fa-solid fa-triangle-exclamation text-amber-500");
    return;
  }

  showModal("Menguji Koneksi", "Menghubungi web app Google Sheets...", "fa-solid fa-circle-notch animate-spin text-brand-600");
  
  try {
    const response = await fetch(`${appState.gasEndpoint}?action=initDatabase`);
    const data = await response.json();
    
    closeModal();
    if (data.success) {
      showModal("Koneksi Berhasil!", "Google Apps Script backend merespons sukses.", "fa-solid fa-circle-check text-emerald-500");
      pullSystemDataFromServer();
    } else {
      showModal("Koneksi Ditolak", `Pesan Error: ${data.error}`, "fa-solid fa-circle-xmark text-rose-500");
    }
  } catch (err) {
    closeModal();
    showModal("Gagal Menghubungi Server", `Periksa hak akses Web App. Error: ${err.toString()}`, "fa-solid fa-circle-xmark text-rose-500");
  }
}

/**
 * Melakukan sinkronisasi penuh (Data Sistem + Kamus User)
 */
async function syncAllData() {
  if (appState.isMockMode || !appState.gasEndpoint) {
    showModal("Mode Offline", "Anda sedang dalam mode mock data. Sambungkan endpoint di pengaturan untuk sinkronisasi.", "fa-solid fa-circle-info text-amber-500");
    return;
  }

  const btnId = 'btn-sync-manual';
  const originalHtml = `<i class="fa-solid fa-arrows-rotate mr-1"></i> Sinkron`;
  
  showSpinnerButton(btnId, true);

  try {
    await pullSystemDataFromServer();
    await pullUserKamusFromServer();
    showModal("Sinkronisasi Sukses", "Pustaka dan kamus pribadi Anda telah diperbarui.", "fa-solid fa-circle-check text-emerald-500");
  } catch (err) {
    console.error("Sync Error:", err);
    showModal("Gagal Sinkron", "Terjadi kendala saat menghubungi server.", "fa-solid fa-circle-xmark text-rose-500");
  } finally {
    showSpinnerButton(btnId, false, originalHtml);
  }
}

/**
 * Menarik data sistem (pustaka, peta kosakata, kata induk, sambungan) dari server.
 */
async function pullSystemDataFromServer() {
  if (appState.isMockMode || !appState.gasEndpoint) return;
  try {
    const btn = document.getElementById('btn-sync-manual');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i>`;
    
    const response = await fetch(appState.gasEndpoint);
    const res = await response.json();
    if (res.status === "success" && res.data) {
      appState.pustaka = res.data.pustaka || [];
      appState.petaKosakata = res.data.peta_kosakata || [];
      appState.kataInduk = res.data.kata_induk || [];
      appState.sambungan = res.data.sambungan || [];
      renderLibrary();
      updateDashboardStats();
    }
  } catch (err) {
    console.error("Gagal menarik naskah sistem: ", err);
  } finally {
    const btn = document.getElementById('btn-sync-manual');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-arrows-rotate mr-1"></i> Sinkron`;
  }
}

/**
 * Menarik kamus personal pengguna dari server.
 */
async function pullUserKamusFromServer() {
  if (appState.isMockMode || !appState.gasEndpoint || !appState.currentUser) return;
  try {
    const res = await apiCall({
      action: "getUserKamus",
      userId: appState.currentUser.userId
    });
    if (res.success && res.data) {
      appState.kamusUser = res.data;
      saveToLocalStorage('meb_local_kamus', res.data);
      updateDashboardStats();
      if (appState.selectedBoxFilter) {
        renderKamusTable(appState.selectedBoxFilter);
      }
    }
  } catch (err) {
    console.error("Gagal sinkron kamus pribadi: ", err);
  }
}