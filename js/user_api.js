/**
 * MODUL KOMUNIKASI API USER (USER API MODULE)
 * Versi: v0.5.6-alpha (Fase 1 - Modular)
 * ID Unik: MEB-USER-API-001
 * * Modul ini menangani pemanggilan API sinkronisasi data user dan sistem
 * dengan Google Apps Script Web App.
 */

import { appState } from './user_app.js';
import { renderLibrary, updateDashboardStats, renderKamusTable } from './user_ui.js';
/**
 * Melakukan pemanggilan POST API secara aman dengan metode CORS dan retries + exponential backoff
 * @param {Object} payload - Objek data payload yang akan dikirim
 * @param {number} retries - Jumlah percobaan jika terjadi kegagalan koneksi
 * @param {number} delay - Waktu tunda awal (ms) sebelum mencoba kembali
 * @returns {Promise<Object>} Respons JSON dari server
 */
export async function apiCall(payload, retries = 5, delay = 1000) {
  if (!appState.gasEndpoint) throw new Error("Endpoint API belum siap.");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(appState.gasEndpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain' }, 
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; 
    }
  }
}

/**
 * Menarik data teks bacaan sistem terkini dari Spreadsheet Server
 */
export async function pullSystemDataFromServer() {
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
      appState.judulHimpunanLatihan = res.data.judul_himpunan_latihan || [];
      
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
 * Menarik data soal latihan tertentu dari Spreadsheet Server berdasarkan ID Himpunan
 * @param {string} setId - ID Himpunan Latihan (ID_Himpunan_Latihan)
 * @returns {Promise<Object>} Respons data soal dari server
 */
export async function fetchExerciseData(setId) {
  if (appState.isMockMode || !appState.gasEndpoint) return null;
  try {
    const res = await apiCall({
      action: "getLatihanQuestions",
      setId: setId
    });
    return res;
  } catch (err) {
    console.error("Gagal menarik data latihan: ", err);
    throw err;
  }
}

/**
 * Menarik riwayat skor latihan user untuk himpunan tertentu dari Spreadsheet Server.
 * @param {string} userId - ID User.
 * @param {string} setId - ID Himpunan Latihan.
 * @returns {Promise<Object>} Respons data riwayat skor dari server.
 */
export async function fetchExerciseScoreHistory(userId, setId) {
  if (appState.isMockMode || !appState.gasEndpoint || !userId || !setId) return null;
  try {
    const res = await apiCall({
      action: "getExerciseScoreHistory",
      userId: userId,
      setId: setId
    });
    return res;
  } catch (err) {
    console.error("Gagal menarik riwayat skor latihan: ", err);
    throw err;
  }
}

/**
 * Menarik data kamus pribadi user terkini dari Spreadsheet Server
 */
export async function pullUserKamusFromServer() {
  if (appState.isMockMode || !appState.gasEndpoint || !appState.currentUser) return;
  try {
    const res = await apiCall({
      action: "getUserKamus",
      userId: appState.currentUser.userId
    });
    if (res.success && res.data) {
      appState.kamusUser = res.data;
      localStorage.setItem('meb_local_kamus', JSON.stringify(res.data));
      updateDashboardStats();
      if (appState.selectedBoxFilter) {
        renderKamusTable(appState.selectedBoxFilter);
      }
    }
  } catch (err) {
    console.error("Gagal sinkron kamus pribadi: ", err);
  }
}
