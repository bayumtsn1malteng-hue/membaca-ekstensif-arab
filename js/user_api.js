/**
 * MODUL KOMUNIKASI API USER (USER API MODULE)
 * Versi: v0.8.9-alpha (Sync Version)
 * ID Unik: MEB-USER-API-001
 * * Modul ini menangani pemanggilan API sinkronisasi data user dan sistem
 * dengan Google Apps Script Web App.
 */

import { appState, db } from './user_state.js';
import { renderLibrary, updateDashboardStats, renderKamusTable, showModal } from './user_ui.js'; //
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

let isSystemSyncing = false;

/**
 * Menarik data teks bacaan sistem terkini dari Spreadsheet Server
 */
export async function pullSystemDataFromServer() {
  if (isSystemSyncing || appState.isMockMode || !appState.gasEndpoint) return;

  isSystemSyncing = true;
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
      
      
        // Cache data sistem secara massal ke IndexedDB
      await Promise.all([
        db.pustaka.bulkPut(appState.pustaka),
        db.petaKosakata.bulkPut(appState.petaKosakata),
        db.kataInduk.bulkPut(appState.kataInduk),
        db.sambungan.bulkPut(appState.sambungan)
      ]);
      console.log("[DB] Data Sistem berhasil diperbarui di IndexedDB");


      renderLibrary();
      updateDashboardStats();
    }
  } catch (err) {
    console.error("Gagal menarik naskah sistem: ", err);
    showModal("Sinkronisasi Gagal", "Gagal menarik data naskah dari server.", "fa-solid fa-triangle-exclamation text-amber-500", () => pullSystemDataFromServer());
  } finally {
    isSystemSyncing = false;
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
let isUserKamusSyncing = false;

export async function pullUserKamusFromServer() {
  if (isUserKamusSyncing || appState.isMockMode || !appState.gasEndpoint || !appState.currentUser) return;

  isUserKamusSyncing = true;
  try {
    const res = await apiCall({
      action: "getUserKamus",
      userId: appState.currentUser.userId
    });
    if (res.success && res.data) {
      appState.kamusUser = res.data;
      
      // Strategi "Remote Wins": Bersihkan cache lokal sebelum menyimpan data segar dari server
      // Ini memastikan data mock atau data user sebelumnya tidak tercampur.
      await db.kamusUser.clear();
      await db.kamusUser.bulkPut(res.data);
      
      // Re-hydrate state lokal dari database yang baru saja diperbarui
      appState.kamusUser = await db.kamusUser.toArray();
      
      updateDashboardStats();
      if (appState.selectedBoxFilter) {
        renderKamusTable(appState.selectedBoxFilter);
      }
    } else {
      console.warn("[Sync] Gagal menarik kamus pribadi:", res.error);
      showModal("Sinkronisasi Kamus Gagal", res.error || "Server tidak memberikan data kamus.", "fa-solid fa-triangle-exclamation text-amber-500", () => pullUserKamusFromServer());
    }
  } catch (err) {
    console.error("Gagal sinkron kamus pribadi: ", err);
    showModal("Kesalahan Jaringan", "Gagal menghubungi server untuk mengambil kamus pribadi.", "fa-solid fa-wifi text-rose-500", () => pullUserKamusFromServer());
  } finally {
    isUserKamusSyncing = false;
  }
}

/**
 * Mengambil daftar judul unik dari pustaka dan himpunan latihan yang tersimpan di appState.
 * Digunakan untuk mengisi dropdown filter pada pengaturan Leitner.
 * @returns {Object} Objek berisi array judul pustaka dan judul latihan.
 */
export function getUniqueSourceTitles() {
  // Mapping judul dari Pustaka Bacaan
  const readingTitles = appState.pustaka.map(item => ({
    id: item.ID_Teks,
    title: item.Judul_Teks || item.Terjemah_Judul_Indonesia || item.Judul_Teks_Arab || "Tanpa Judul"
  }));

  // Mapping judul dari Himpunan Latihan
  const exerciseTitles = appState.judulHimpunanLatihan.map(item => ({
    id: item.ID_Himpunan_Latihan,
    title: item.Judul_Himpunan_Latihan || "Latihan Tanpa Judul"
  }));

  return { readingTitles, exerciseTitles };
}
