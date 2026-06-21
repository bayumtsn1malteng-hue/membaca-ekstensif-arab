/**
 * MODUL EVENT HANDLER (USER EVENTS MODULE)
 * Versi: v0.2.0
 * Menangani logika interaksi user, auth, kontrol Leitner, backup/restore, dan utilitas.
 */
import { appState, db, MOCK_PUSTAKA, MOCK_PETA_KOSAKATA, MOCK_KATA_INDUK, MOCK_SAMBUNGAN } from './user_state.js';
import { apiCall, pullSystemDataFromServer, pullUserKamusFromServer, getUniqueSourceTitles } from './user_api.js';
import {
  switchView, renderLibrary, updateDashboardStats, setupUserInterface,
  showModal, updateModalProgress, showSpinnerButton, renderKamusTable, loadReader,
  showDictModal, hideDictModal, buildDynamicModeBLayout, loadLeitnerCard,
  closeLeitnerSession, toggleMinimalistMode, closeModal
} from './user_ui.js';
import { cleanArabicHarakat, normalizeArabic } from '../shared/arabic_utils.js';

// ============================================================
// --- MANAJEMEN OTENTIKASI USER ---
// ============================================================

export async function handleAuthSubmit(event) {
  event.preventDefault();
  const userVal = document.getElementById('auth-username').value.trim();
  const passVal = document.getElementById('auth-password').value.trim();

  if (!userVal || !passVal) return;

  showSpinnerButton('auth-submit-btn', true);

  if (appState.isMockMode) {
    // Mode Demo Offline
    setTimeout(() => {
      showSpinnerButton('auth-submit-btn', false, appState.isAuthRegister ? "Daftar Sekarang" : "Masuk Sekarang");
      const mockUser = {
        userId: "USR-MOCK-999",
        username: userVal,
        stats: { teksDibaca: 0, kataLearning: 0, kataKnown: 0 }
      };
      appState.currentUser = mockUser;
      localStorage.setItem('meb_user', JSON.stringify(mockUser));
      setupUserInterface();
      loadMockData(false);
      switchView('library');
      showModal("Simulasi Masuk Berhasil", "Selamat datang di Mode Offline MEB Reader!", "fa-solid fa-circle-check text-emerald-500");
    }, 850);
  } else {
    // Mode Hubungan Server Riil
    try {
      const action = appState.isAuthRegister ? "registerUser" : "loginUser";
      const res = await apiCall({
        action: action,
        username: userVal,
        password: passVal
      }, 5, 1000);

      if (res.success || res.userId) {
        const userObj = {
          userId: res.userId,
          username: res.username || userVal,
          stats: res.stats || { teksDibaca: 0, kataLearning: 0, kataKnown: 0 }
        };
        appState.currentUser = userObj;
        localStorage.setItem('meb_user', JSON.stringify(userObj));
        setupUserInterface();
        await pullSystemDataFromServer();
        await pullUserKamusFromServer();
        switchView('library');
        showModal("Masuk Berhasil", `Selamat datang kembali, ${userObj.username}!`, "fa-solid fa-cloud-check text-brand-500");
      } else {
        showModal("Otentikasi Ditolak", res.error || "Gagal berkomunikasi dengan database.", "fa-solid fa-circle-xmark text-rose-500");
      }
    } catch (err) {
      showModal("Kesalahan Koneksi", "Gagal menghubungi Apps Script Anda: " + err.toString(), "fa-solid fa-triangle-exclamation text-amber-500");
    } finally {
      showSpinnerButton('auth-submit-btn', false, appState.isAuthRegister ? "Daftar Sekarang" : "Masuk Sekarang");
    }
  }
}

export function bypassLogin() {
  const userObj = {
    userId: "USR-GUEST",
    username: "Guest_MEB",
    stats: { teksDibaca: 0, kataLearning: 0, kataKnown: 0 }
  };
  appState.currentUser = userObj;
  localStorage.setItem('meb_user', JSON.stringify(userObj));
  setupUserInterface();
  loadMockData(false);
  switchView('library');
  showModal("Mode Tamu Aktif", "Bekerja dalam database simulasi lokal browser.", "fa-solid fa-user-secret text-slate-500");
}

export function logout() {
  appState.currentUser = null;
  localStorage.removeItem('meb_user');
  appState.kamusUser = [];
  db.kamusUser.clear();

  document.getElementById('sidebar-name').textContent = "Guest Mode";
  document.getElementById('sidebar-avatar').textContent = "G";
  document.getElementById('sidebar-logout-btn').classList.add('hidden');
  document.getElementById('header-avatar').textContent = "G";

  switchView('login');
}

export function handleAvatarClick() {
  if (!appState.currentUser || appState.currentUser.userId === 'USR-GUEST') {
    logout();
  }
}

// ============================================================
// --- MANAJEMEN DATABASE MOCK & DATA LOKAL ---
// ============================================================

export async function loadMockData(clear) {
  if (clear) {
    await db.kamusUser.clear();
    appState.kamusUser = [];
    showModal("Database Reset", "Mock data direset ke kondisi default.", "fa-solid fa-database text-amber-500");
  }

  if (appState.pustaka.length === 0) appState.pustaka = MOCK_PUSTAKA;
  if (appState.petaKosakata.length === 0) appState.petaKosakata = MOCK_PETA_KOSAKATA;
  if (appState.kataInduk.length === 0) appState.kataInduk = MOCK_KATA_INDUK;
  if (appState.sambungan.length === 0) appState.sambungan = MOCK_SAMBUNGAN;

  renderLibrary();
  updateDashboardStats();
}

export async function migrateFromLocalStorage() {
  const oldKamus = localStorage.getItem('meb_local_kamus');
  if (oldKamus) {
    try {
      const parsed = JSON.parse(oldKamus);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log("[DB] Migrasi data kamus ke IndexedDB...");
        await db.kamusUser.bulkPut(parsed);
        localStorage.removeItem('meb_local_kamus');
        console.log("[DB] Migrasi berhasil.");
      }
    } catch (e) { console.error("Migrasi gagal:", e); }
  }
}

export async function hydrateAppStateFromDB() {
  console.log("[DB] Memulai hidrasi state dari IndexedDB...");
  const [pustaka, peta, kamus, induk, sambungan, bookmarks, settings] = await Promise.all([
    db.pustaka.toArray(),
    db.petaKosakata.toArray(),
    db.kamusUser.toArray(),
    db.kataInduk.toArray(),
    db.sambungan.toArray(),
    db.bookmarks.toArray(),
    db.settings.toArray()
  ]);
  appState.pustaka = pustaka;
  appState.petaKosakata = peta;
  appState.kamusUser = kamus;
  appState.kataInduk = induk;
  appState.sambungan = sambungan;
  appState.bookmarkedQuestions = bookmarks;

  const leitnerSetting = settings.find(s => s.key === 'leitner_filter');
  if (leitnerSetting) {
    appState.leitnerFilter = leitnerSetting.value;
    const sourceEl = document.getElementById('leitner-filter-source');
    if (sourceEl) {
      sourceEl.value = appState.leitnerFilter.source;
      handleLeitnerSourceChange(true);
    }
  }

  updateDashboardStats();
  checkLeitnerReminders();
}

export async function checkAndAutoRestore() {
  if (!appState.currentUser || appState.isMockMode || !appState.gasEndpoint) return;

  const pustakaCount = await db.pustaka.count();
  const kamusCount = await db.kamusUser.count();

  if (pustakaCount === 0 && kamusCount === 0) {
    await importLatestBackupFromDrive(true);
  }
}

// ============================================================
// --- INTERAKSI PEMBACA KATA (WORD CLICK & KAMUS MODAL) ---
// ============================================================

export function handleWordClick(arabicWordWithHarakat) {
  const cleanWordWithHarakat = arabicWordWithHarakat
    .replace(/[.,\/#!$%\^\&\*;:{}=\-_`~()؟،]/g, "")
    .replace(/[\r\n]/g, "")
    .trim();

  const cleanWordPolos = cleanArabicHarakat(cleanWordWithHarakat);

  appState.activeWordSelected = {
    withHarakat: cleanWordWithHarakat,
    polos: cleanWordPolos
  };

  document.getElementById('dict-word-text').textContent = cleanWordWithHarakat;
  const targetNormal = normalizeArabic(cleanWordWithHarakat);

  let mapping = appState.petaKosakata.find(m => {
    if (!m) return false;
    const dbKataTeksNormal = normalizeArabic(m.Kata_Teks);
    const dbKataPolosNormal = normalizeArabic(m.Kata_Teks_Polos);
    return dbKataTeksNormal === targetNormal || dbKataPolosNormal === targetNormal;
  });

  if (!mapping) {
    const directRoot = appState.kataInduk.find(ki => {
      if (!ki) return false;
      const dbKataIndukNormal = normalizeArabic(ki.Kata_Induk);
      const dbKataIndukPolosNormal = normalizeArabic(ki.Kata_Induk_Polos);
      return dbKataIndukNormal === targetNormal || dbKataIndukPolosNormal === targetNormal;
    });

    if (directRoot) {
      mapping = {
        ID_Kosakata: "VIRTUAL-" + directRoot.ID_Kata_Induk,
        ID_Teks: appState.currentReadingText ? appState.currentReadingText.ID_Teks : "",
        Kata_Teks: directRoot.Kata_Induk,
        Kata_Teks_Polos: directRoot.Kata_Induk_Polos,
        Arti_Kata_Teks: directRoot.Arti_Kata_Induk,
        ID_Kata_Induk: directRoot.ID_Kata_Induk
      };
    }
  }

  if (mapping) {
    const isModeB = mapping.Sambungan_Awal_1 || mapping.Sambungan_Awal_2 || mapping.Sambungan_Akhir_1 || mapping.Sambungan_Akhir_2;

    if (isModeB) {
      document.getElementById('kamus-mode-tag').textContent = "Mode B (Affix)";
      document.getElementById('kamus-mode-tag').className = "text-[9px] uppercase font-bold px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400";

      document.getElementById('dict-mode-a').classList.add('hidden');
      document.getElementById('dict-mode-b').classList.remove('hidden');

      buildDynamicModeBLayout(mapping, cleanWordWithHarakat);
      appState.activeWordSelected.idKataInduk = mapping.ID_Kata_Induk;
      appState.activeWordSelected.idKosakata = mapping.ID_Kosakata;

    } else {
      document.getElementById('kamus-mode-tag').textContent = "Mode A (Murni)";
      document.getElementById('kamus-mode-tag').className = "text-[9px] uppercase font-bold px-2.5 py-1 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400";

      document.getElementById('dict-mode-b').classList.add('hidden');
      document.getElementById('dict-mode-a').classList.remove('hidden');

      const parentWord = appState.kataInduk.find(ki => ki.ID_Kata_Induk === mapping.ID_Kata_Induk);
      if (parentWord) {
        document.getElementById('modea-root').textContent = parentWord.Kata_Induk;
        document.getElementById('modea-root-meaning').textContent = parentWord.Arti_Kata_Induk;
        appState.activeWordSelected.idKataInduk = parentWord.ID_Kata_Induk;
      } else {
        document.getElementById('modea-root').textContent = cleanWordWithHarakat;
        document.getElementById('modea-root-meaning').textContent = mapping.Arti_Kata_Teks;
        appState.activeWordSelected.idKataInduk = "";
      }
    }

    document.getElementById('dict-custom-meaning').value = "";
    document.getElementById('dict-word-meaning-header').textContent = mapping.Arti_Kata_Teks || "Belum ada arti";
  } else {
    document.getElementById('kamus-mode-tag').textContent = "Tanpa Relasi";
    document.getElementById('kamus-mode-tag').className = "text-[9px] uppercase font-bold px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500";
    document.getElementById('dict-mode-b').classList.add('hidden');
    document.getElementById('dict-mode-a').classList.remove('hidden');

    document.getElementById('modea-root').textContent = cleanWordWithHarakat;
    document.getElementById('modea-root-meaning').textContent = "Kata mandiri (belum didefinisikan)";

    document.getElementById('dict-custom-meaning').value = "";
    document.getElementById('dict-word-meaning-header').textContent = "Kata mandiri (belum didefinisikan)";
    appState.activeWordSelected.idKataInduk = "";
  }
  // === KODE DEBUG UNTUK MELACAK SAAT KATA DIKLIK ===
  console.log("=== DEBUG HANDLE WORD CLICK ===");
  console.log("Kata yang diklik:", cleanWordWithHarakat);
  if (mapping) {
    console.log("Data mapping ditemukan:", mapping);
    console.log("ID_Kosakata dari mapping:", mapping.ID_Kosakata);
    
    // Kita pastikan sekali lagi baris penitipan ini tereksekusi
    appState.activeWordSelected.idKosakata = mapping.ID_Kosakata;
    console.log("Isi appState.activeWordSelected SEKARANG:", appState.activeWordSelected);
  } else {
    console.warn("Peringatan: Kata tidak ditemukan di petaKosakata!");
  }
  console.log("===============================");


  showDictModal();
}

// ============================================================
// --- EVALUASI MEMBACA & PROGRES KAMUS PERSONAL ---
// ============================================================

export async function markReadAsFinished() {
  if (!appState.currentReadingText || !appState.currentUser) return;

  const userId = appState.currentUser.userId;
  const textId = appState.currentReadingText.ID_Teks;

  if (appState.isMockMode) {
    appState.currentUser.stats.teksDibaca = (appState.currentUser.stats.teksDibaca || 0) + 1;
    localStorage.setItem('meb_user', JSON.stringify(appState.currentUser));
    updateDashboardStats();
    showModal("Buku Selesai!", "Progres membaca Anda berhasil ditingkatkan.", "fa-solid fa-trophy text-amber-500");
  } else {
    try {
      showSpinnerButton('btn-complete-read', true);
      const res = await apiCall({
        action: "updateReadingProgress",
        userId: userId,
        textId: textId,
        isFinished: true
      });
      if (res.success) {
        appState.currentUser.stats.teksDibaca++;
        localStorage.setItem('meb_user', JSON.stringify(appState.currentUser));
        updateDashboardStats();
        showModal("Buku Selesai!", "Progres disinkronkan aman ke database Google Sheets Anda.", "fa-solid fa-cloud-arrow-up text-brand-600");
      }
    } catch (err) {
      showModal("Offline Fallback", "Gagal menghubungi server. Data disimpan lokal.", "fa-solid fa-wifi text-slate-400");
    } finally {
      showSpinnerButton('btn-complete-read', false, "Tandai Selesai Membaca");
    }
  }
}
// ============================
// MENYIMPAN KOSAKATA TERPILIH
// ============================
export async function saveWordToPersonalKamus() {
  if (!appState.activeWordSelected || !appState.currentUser) return;

  //DEBUG
  console.log("=== DEBUG SAVE WORD TO KAMUS ===");
  console.log("1. Seluruh isi activeWordSelected:", appState.activeWordSelected);
  console.log("2. idKosakata yang dibaca:", appState.activeWordSelected.idKosakata);
  console.log("3. Status Mock Mode saat ini (True/False):", appState.isMockMode);
  console.log("=================================");
  //===================



  const userId = appState.currentUser.userId;
  const wordPolos = appState.activeWordSelected.polos;
  const idKataInduk = appState.activeWordSelected.idKataInduk || "IND-NASKAH";
  const customMeaning = document.getElementById('dict-custom-meaning').value.trim();
  
  // Ambil idKosakata yang sudah kita titipkan saat kata diklik
  const idKosakataAsal = appState.activeWordSelected.idKosakata || "";

  if (appState.isMockMode) {
    const exist = appState.kamusUser.some(k => k.Kata_Polos === wordPolos && k.ID_User === userId);
    if (exist) {
      showModal("Kosakata Tersimpan", "Kata ini sudah ada di daftar belajar Leitner Anda.", "fa-solid fa-circle-exclamation text-amber-500");
      return;
    }

    // LOGIKA BARU: Tentukan awalan (prefix) berdasarkan asal idKosakata
    const prefix = idKosakataAsal.startsWith("VOC-LAT-") ? "VOC-LAT-" : "VOC-";
    const randomID = Math.floor(100000 + Math.random() * 900000);

    const newWord = {
      // Sekarang ID tidak lagi di-hardcode "VOC-", melainkan dinamis
      ID_User_Word: prefix + randomID,
      ID_User: userId,
      Kata_Polos: wordPolos,
      ID_Kata_Induk: idKataInduk,
      Arti_Kustom: customMeaning,
      Status_Belajar: 1,
      Tanggal_Simpan: new Date().toISOString(),
      Tanggal_Update: new Date().toISOString(),
      Tanggal_Review_Berikutnya: new Date(Date.now() + 86400000).toISOString(),
      Streak_Benar: 0
    };

    appState.kamusUser.push(newWord);
    await db.kamusUser.put(newWord);
    updateDashboardStats();

    if (appState.currentReadingText) {
      loadReader(appState.currentReadingText.ID_Teks);
    }

    hideDictModal();
    showModal("Berhasil Menyimpan", `"${appState.activeWordSelected.withHarakat}" dimasukkan ke Box 1 Kamus Leitner Anda.`, "fa-solid fa-folder-plus text-teal-600");
  } else {
    try {
      showSpinnerButton('btn-save-vocab', true);
      
      // LOGIKA BARU: Ikut kirimkan 'idKosakata' ke server/API
      const res = await apiCall({
        action: "addWordToKamus",
        userId: userId,
        idKataInduk: idKataInduk,
        kataPolos: wordPolos,
        artiKustom: customMeaning,
        idKosakata: idKosakataAsal // <--- Data tambahan untuk diolah Backend
      });
      
      if (res.success) {
        const serverWord = {
          ID_User_Word: res.idUserWord, // Backend akan mengembalikan ID dengan awalan yang benar
          ID_User: userId,
          Kata_Polos: wordPolos,
          ID_Kata_Induk: idKataInduk,
          Arti_Kustom: customMeaning,
          Status_Belajar: 1,
          Tanggal_Simpan: new Date().toISOString(),
          Tanggal_Update: new Date().toISOString(),
          Tanggal_Review_Berikutnya: new Date(Date.now() + 86400000).toISOString(),
          Streak_Benar: 0
        };
        appState.kamusUser.push(serverWord);
        await db.kamusUser.put(serverWord);
        updateDashboardStats();

        if (appState.currentReadingText) {
          loadReader(appState.currentReadingText.ID_Teks);
        }

        hideDictModal();
        showModal("Sinkronisasi Sukses", "Kata tersimpan ke Google Sheets & siap dipelajari.", "fa-solid fa-cloud-arrow-up text-brand-600");
      }
    } catch (err) {
      showModal("Gagal Menghubungi Server", err.toString(), "fa-solid fa-triangle-exclamation text-amber-500");
    } finally {
      showSpinnerButton('btn-save-vocab', false, "Masukkan ke Kamus Leitner");
    }
  }
}

// ============================================================
// --- MANAJEMEN TABEL & SESI LEITNER ---
// ============================================================

export async function deleteKamusWord(idUserWord) {
  appState.kamusUser = appState.kamusUser.filter(item => item.ID_User_Word !== idUserWord);
  await db.kamusUser.delete(idUserWord);
  renderKamusTable(appState.selectedBoxFilter);
  updateDashboardStats();
  showModal("Dihapus", "Kosakata berhasil dihilangkan dari kamus personal Anda.", "fa-solid fa-trash-arrow-up text-rose-500");
}

export function handleLeitnerSourceChange(isInitialLoad = false) {
  const sourceEl = document.getElementById('leitner-filter-source');
  const group = document.getElementById('leitner-specific-title-group');
  const selectTitle = document.getElementById('leitner-filter-title');

  if (!sourceEl || !group || !selectTitle) return;

  const source = sourceEl.value;

  if (source === 'all') {
    group.classList.add('hidden');
    return;
  }

  group.classList.remove('hidden');

  const now = new Date();
  const dueKamusItems = appState.kamusUser.filter(ku => {
    const reviewDate = new Date(ku.Tanggal_Review_Berikutnya);
    return ku.Status_Belajar !== 'Known' && reviewDate <= now;
  });

  // === AWAL BLOK TOTAL SOURCE COUNT DENGAN DEBUG ===
  const totalSourceCount = dueKamusItems.filter(ku => {
    // Pengaman jika ada data yang korup atau tidak punya ID
    if (!ku || !ku.ID_User_Word) {
      console.warn("[DEBUG FILTER] Menemukan data kamus yang tidak valid:", ku);
      return false;
    }
    
    // Logika pengecekan awalan ID
    const isFromExercise = ku.ID_User_Word.startsWith('VOC-LAT-');
    
    // Log pembantu: jika sistem menemukan kata berawalan VOC-LAT-, kita cetak ke console
    if (isFromExercise) {
      console.log(`[DEBUG FILTER] Menemukan kata LATIHAN! ID: ${ku.ID_User_Word}, Status Belajar: ${ku.Status_Belajar}`);
    }

    // Logika penyaringan berdasarkan menu yang sedang aktif (source)
    return (source === 'reading' && !isFromExercise) || (source === 'exercise' && isFromExercise);
  }).length;

  // Log hasil akhir: Melihat berapa total kata yang berhasil lolos filter
  console.log(`[DEBUG RESULT] Menu Aktif: '${source}'. Total kata yang lolos filter = ${totalSourceCount}`);
  // === AKHIR BLOK TOTAL SOURCE COUNT ===

  selectTitle.innerHTML = `<option value="all">Semua Judul (${totalSourceCount} kata)</option>`;

  const { readingTitles, exerciseTitles } = getUniqueSourceTitles();
  let list = source === 'reading' ? readingTitles : exerciseTitles;

  list.forEach(item => {
    const count = dueKamusItems.filter(ku => {
      const isFromExercise = ku.ID_User_Word.startsWith('VOC-LAT-');
      if (source === 'reading' && isFromExercise) return false;
      if (source === 'exercise' && !isFromExercise) return false;

      const mapping = appState.petaKosakata.find(m => m.ID_Kata_Induk === ku.ID_Kata_Induk);
      return mapping && mapping.ID_Teks === item.id;
    }).length;

    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = `${item.title} (${count} kata)`;
    selectTitle.appendChild(opt);
  });

  if (isInitialLoad && appState.leitnerFilter.specificId) {
    selectTitle.value = appState.leitnerFilter.specificId;
  }
}

export async function saveLeitnerSettings() {
  const sourceEl = document.getElementById('leitner-filter-source');
  const titleEl = document.getElementById('leitner-filter-title');

  if (!sourceEl || !titleEl) return;

  const source = sourceEl.value;
  const specificId = source === 'all' ? 'all' : titleEl.value;

  if (source !== 'all' && specificId !== 'all') {
    const { readingTitles, exerciseTitles } = getUniqueSourceTitles();
    const list = source === 'reading' ? readingTitles : exerciseTitles;
    const isValid = list.some(item => item.id === specificId);

    if (!isValid) {
      showModal("Pilihan Tidak Valid", "Judul yang dipilih tidak ditemukan atau belum dimuat sepenuhnya.", "fa-solid fa-triangle-exclamation text-rose-500");
      return;
    }
  }

  appState.leitnerFilter = { source, specificId };

  try {
    await db.settings.put({ key: 'leitner_filter', value: appState.leitnerFilter });
    document.getElementById('leitner-settings-modal').classList.add('hidden');
    showModal("Pengaturan Disimpan", "Filter sesi review telah diperbarui secara permanen.", "fa-solid fa-circle-check text-emerald-500");
  } catch (err) {
    console.error("[DB] Gagal menyimpan pengaturan:", err);
    showModal("Gagal Menyimpan", "Terjadi kendala saat mengakses database lokal.", "fa-solid fa-triangle-exclamation text-rose-500");
  }
}

export async function resetLeitnerSettings() {
  appState.leitnerFilter = { source: 'all', specificId: 'all' };

  try {
    await db.settings.put({ key: 'leitner_filter', value: appState.leitnerFilter });

    const sourceEl = document.getElementById('leitner-filter-source');
    if (sourceEl) {
      sourceEl.value = 'all';
      handleLeitnerSourceChange();
    }

    showModal("Filter Direset", "Pengaturan telah dikembalikan ke kondisi awal (Semua Kosakata).", "fa-solid fa-rotate-left text-brand-600");
  } catch (err) {
    console.error("[DB] Gagal mereset pengaturan:", err);
    showModal("Gagal Mereset", "Terjadi kendala saat mengakses database lokal.", "fa-solid fa-circle-xmark text-rose-500");
  }
}

export function startLeitnerSession() {
  const now = new Date();

  let dueWords = appState.kamusUser.filter(item => {
    const reviewDate = new Date(item.Tanggal_Review_Berikutnya);
    const isDue = item.Status_Belajar !== 'Known' && reviewDate <= now;

    let sourceMatch = true;
    const isFromExercise = item.ID_User_Word.startsWith('VOC-LAT-');

    if (appState.leitnerFilter.source === 'reading' && isFromExercise) sourceMatch = false;
    if (appState.leitnerFilter.source === 'exercise' && !isFromExercise) sourceMatch = false;

    let titleMatch = true;
    if (appState.leitnerFilter.specificId !== 'all') {
      const mapping = appState.petaKosakata.find(m => m.ID_Kata_Induk === item.ID_Kata_Induk);
      titleMatch = mapping && mapping.ID_Teks === appState.leitnerFilter.specificId;
    }

    return isDue && sourceMatch && titleMatch;
  });

  if (dueWords.length === 0) {
    showModal("Review Selesai", "Tidak ada kosakata yang perlu ditinjau hari ini berdasarkan filter Anda.", "fa-solid fa-circle-check text-emerald-500");
    return;
  }

  appState.leitnerSessionWords = dueWords;
  appState.leitnerSessionIndex = 0;

  toggleMinimalistMode(true);
  document.getElementById('leitner-modal').classList.remove('hidden');
  loadLeitnerCard();
}

export async function submitLeitnerResult(isCorrect) {
  const word = appState.leitnerSessionWords[appState.leitnerSessionIndex];

  if (appState.isMockMode) {
    const itemIndex = appState.kamusUser.findIndex(k => k.ID_User_Word === word.ID_User_Word);
    if (itemIndex !== -1) {
      const current = appState.kamusUser[itemIndex];
      if (isCorrect) {
        current.Streak_Benar++;
        if (current.Status_Belajar < 5) {
          current.Status_Belajar = Number(current.Status_Belajar) + 1;
        } else {
          current.Status_Belajar = 'Known';
        }
      } else {
        current.Status_Belajar = 1;
        current.Streak_Benar = 0;
      }
      const reviewIntervals = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 'Known': 30 };
      const nextReviewDays = reviewIntervals[current.Status_Belajar] || 1;
      current.Tanggal_Review_Berikutnya = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000).toISOString();
      current.Tanggal_Update = new Date().toISOString();
      await db.kamusUser.put(appState.kamusUser[itemIndex]);
    }
    nextLeitnerCard();
  } else {
    if (word && word.ID_User_Word) {
      appState.leitnerReviewResults.push({
        idUserWord: word.ID_User_Word,
        isCorrect: isCorrect === true
      });
    }

    const itemIndex = appState.kamusUser.findIndex(k => k.ID_User_Word === word.ID_User_Word);
    if (itemIndex !== -1) {
      const current = appState.kamusUser[itemIndex];
      if (isCorrect) {
        current.Streak_Benar++;
        if (current.Status_Belajar < 5) {
          current.Status_Belajar = Number(current.Status_Belajar) + 1;
        } else {
          current.Status_Belajar = 'Known';
        }
      } else {
        current.Status_Belajar = 1;
        current.Streak_Benar = 0;
      }
      const reviewIntervals = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 'Known': 30 };
      const nextReviewDays = reviewIntervals[current.Status_Belajar] || 1;
      current.Tanggal_Review_Berikutnya = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000).toISOString();
      current.Tanggal_Update = new Date().toISOString();
      await db.kamusUser.put(appState.kamusUser[itemIndex]);
    }
    nextLeitnerCard();
  }
}

export async function nextLeitnerCard() {
  appState.leitnerSessionIndex++;
  if (appState.leitnerSessionIndex < appState.leitnerSessionWords.length) {
    loadLeitnerCard();
  } else {
    await closeLeitnerSession();
    updateDashboardStats();
    if (appState.currentReadingText) {
      loadReader(appState.currentReadingText.ID_Teks);
    }
  }
}

// ============================================================
// --- LOGIKA BACKUP & RESTORE ---
// ============================================================

export function validateBackupData(data) {
  if (!data || typeof data !== 'object') return "File cadangan bukan format JSON yang valid.";
  if (!data.tables || typeof data.tables !== 'object') return "Struktur tabel cadangan tidak ditemukan.";

  const requiredTables = ["pustaka", "petaKosakata", "kamusUser", "kataInduk", "sambungan"];
  for (const table of requiredTables) {
    if (!data.tables[table] || !Array.isArray(data.tables[table])) {
      return `Data tabel '${table}' hilang atau korup.`;
    }
  }
  return null;
}

export async function importDatabaseFromJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importData = JSON.parse(e.target.result);

      const integrityError = validateBackupData(importData);
      if (integrityError) {
        showModal("Integritas Gagal", integrityError, "fa-solid fa-triangle-exclamation text-rose-500");
        throw new Error("Format file cadangan tidak valid.");
      }

      const confirmImport = confirm("Peringatan: Impor data akan menimpa seluruh data lokal saat ini. Lanjutkan?");
      if (!confirmImport) return;

      showModal("Memproses Impor", "Mohon tunggu, sedang memulihkan database...", "fa-solid fa-spinner animate-spin text-brand-600");

      for (const tableName in importData.tables) {
        if (db[tableName]) {
          await db[tableName].clear();
          await db[tableName].bulkPut(importData.tables[tableName]);
        }
      }

      await hydrateAppStateFromDB();
      renderLibrary();
      updateDashboardStats();

      showModal("Pemulihan Berhasil", "Seluruh data telah berhasil dipulihkan dari cadangan.", "fa-solid fa-circle-check text-emerald-500");
      sendLocalNotification("Impor Selesai", "Database lokal telah diperbarui dari file cadangan.");

    } catch (err) {
      showModal("Gagal Impor", "Terjadi kesalahan saat membaca file: " + err.message, "fa-solid fa-circle-xmark text-rose-500");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

export async function _generateBackupData() {
  const exportData = {
    timestamp: new Date().toISOString(),
    version: "v0.9.0-alpha",
    tables: {}
  };
  for (const table of db.tables) {
    exportData.tables[table.name] = await table.toArray();
  }
  return exportData;
}

export async function exportDatabaseToJson() {
  try {
    const exportData = await _generateBackupData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MEB_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showModal("Backup Berhasil", "Seluruh data lokal Anda telah berhasil diekspor.", "fa-solid fa-file-export text-emerald-500");
  } catch (err) {
    showModal("Backup Gagal", err.toString(), "fa-solid fa-circle-xmark text-rose-500");
  }
}

export async function uploadBackupToDrive() {
  if (!appState.currentUser || appState.isMockMode) {
    showModal("Akses Ditolak", "Fitur ini hanya tersedia untuk pengguna yang login dan terhubung ke server.", "fa-solid fa-triangle-exclamation text-amber-500");
    return;
  }

  showModal("Mengunggah Cadangan", "Mempersiapkan data dan mengunggah ke Google Drive Anda...", "fa-solid fa-cloud-arrow-up animate-pulse text-brand-600");
  try {
    const backupData = await _generateBackupData();
    const res = await apiCall({
      action: "uploadBackupToDrive",
      userId: appState.currentUser.userId,
      backupData: JSON.stringify(backupData, null, 2)
    });

    if (res.success) {
      showModal("Cadangan Berhasil", `Data Anda berhasil dicadangkan ke Google Drive sebagai "${res.fileName}".`, "fa-solid fa-cloud-check text-emerald-500");
      sendLocalNotification("Backup Berhasil", "Cadangan data otomatis telah disimpan di Google Drive.");
    } else {
      showModal("Cadangan Gagal", res.error || "Terjadi kesalahan saat mengunggah cadangan.", "fa-solid fa-circle-xmark text-rose-500");
    }
  } catch (err) {
    showModal("Kesalahan Koneksi", "Gagal menghubungi server untuk mengunggah cadangan: " + err.toString(), "fa-solid fa-triangle-exclamation text-amber-500");
  }
}

export async function importLatestBackupFromDrive(isAuto = false) {
  if (!appState.currentUser || appState.isMockMode) {
    if (!isAuto) showModal("Akses Ditolak", "Login diperlukan untuk mengakses Drive.", "fa-solid fa-lock text-rose-500");
    return;
  }

  if (!isAuto) {
    showModal("Menghubungkan Drive", "Mencari file cadangan terbaru di Drive Anda...", "fa-solid fa-cloud-arrow-down animate-pulse text-brand-600");
  }

  try {
    const res = await apiCall({
      action: "getLatestBackupFromDrive",
      userId: appState.currentUser.userId
    });

    if (res.success && res.data) {
      if (!isAuto) {
        const confirmImport = confirm("File cadangan ditemukan di Drive. Apakah Anda yakin ingin menimpa data lokal dengan data tersebut?");
        if (!confirmImport) { closeModal(); return; }
      }

      const integrityError = validateBackupData(res.data);
      if (integrityError) {
        showModal("Integritas Drive Gagal", integrityError, "fa-solid fa-triangle-exclamation text-rose-500");
        return;
      }

      showModal("Memproses Impor", "File cadangan ditemukan. Memulihkan data lokal...", "fa-solid fa-database animate-pulse text-brand-600");

      for (const tableName in res.data.tables) {
        if (db[tableName]) {
          await db[tableName].clear();
          await db[tableName].bulkPut(res.data.tables[tableName]);
        }
      }
      await hydrateAppStateFromDB();

      await db.appLogs.add({
        eventType: isAuto ? 'auto-restore' : 'manual-restore-drive',
        timestamp: new Date().toISOString(),
        status: 'success'
      });

      renderLibrary();
      showModal("Pemulihan Sukses", "Data Anda telah sinkron dengan cadangan Drive terbaru.", "fa-solid fa-cloud-check text-emerald-500");
    } else {
      showModal("Tidak Ditemukan", res.error || "Gagal mengambil data dari Drive.", "fa-solid fa-circle-info text-amber-500");
    }
  } catch (err) {
    showModal("Kesalahan", "Gagal menghubungi server: " + err.toString(), "fa-solid fa-circle-xmark text-rose-500");
  }
}

// ============================================================
// --- LOGIKA UTILITAS & ASET SERVICE WORKER ---
// ============================================================

export async function clearKamusOnly() {
  const confirmReset = confirm("Apakah Anda yakin ingin menghapus seluruh Kamus Leitner Anda? Data Pustaka Bacaan dan pengaturan tetap akan dipertahankan.");
  if (!confirmReset) return;

  try {
    showModal("Membersihkan Kamus", "Sedang menghapus data Leitner...", "fa-solid fa-spinner animate-spin text-amber-600");

    await db.appLogs.add({
      eventType: 'partial-reset-kamus',
      timestamp: new Date().toISOString(),
      status: 'success'
    });

    await db.kamusUser.clear();
    appState.kamusUser = [];

    updateDashboardStats();
    if (appState.selectedBoxFilter) {
      renderKamusTable(appState.selectedBoxFilter);
    }

    showModal("Kamus Dihapus", "Seluruh data kamus personal telah dibersihkan.", "fa-solid fa-circle-check text-emerald-500");
  } catch (err) {
    showModal("Gagal Reset", err.toString(), "fa-solid fa-circle-xmark text-rose-500");
  }
}

export async function clearAllLocalData() {
  const confirmReset = confirm("Peringatan: Ini akan menghapus data lokal (pustaka, kamus) dan mengeluarkan Anda dari aplikasi. Catatan log reset akan dipertahankan. Lanjutkan?");
  if (!confirmReset) return;

  try {
    showModal("Mereset Data", "Sedang membersihkan database lokal...", "fa-solid fa-spinner animate-spin text-rose-600");

    await db.appLogs.add({
      eventType: 'full-reset-local',
      timestamp: new Date().toISOString(),
      status: 'initiated'
    });

    const tablesToClear = db.tables.filter(t => t.name !== 'appLogs');
    await Promise.all(tablesToClear.map(table => table.clear()));

    localStorage.clear();

    showModal("Reset Berhasil", "Semua data lokal telah dihapus. Aplikasi akan dimuat ulang.", "fa-solid fa-circle-check text-emerald-500");

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } catch (err) {
    showModal("Gagal Reset", err.toString(), "fa-solid fa-circle-xmark text-rose-500");
  }
}

export async function triggerSWUpdate() {
  if (!('serviceWorker' in navigator)) {
    showModal("Tidak Didukung", "Browser Anda tidak mendukung Service Worker.", "fa-solid fa-circle-xmark text-rose-500");
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    showModal("Mencari Pembaruan", "Sedang memeriksa versi terbaru di server...", "fa-solid fa-sync animate-spin text-brand-600");
    try {
      await registration.update();
      setTimeout(() => {
        if (!registration.installing && !registration.waiting) {
          showModal("Aplikasi Terkini", "Anda sudah menggunakan versi terbaru dari MEB Arab.", "fa-solid fa-circle-check text-emerald-500");
        }
      }, 2500);
    } catch (err) {
      console.error("[SW] Gagal memeriksa update:", err);
      showModal("Gagal Memeriksa", "Terjadi kesalahan koneksi saat memeriksa pembaruan.", "fa-solid fa-triangle-exclamation text-rose-500");
    }
  }
}

export async function clearMediaCache() {
  const confirmClear = confirm("Apakah Anda yakin ingin menghapus semua gambar pustaka yang diunduh untuk offline? Ini akan mengosongkan ruang penyimpanan.");
  if (!confirmClear) return;

  showModal("Menghapus Cache Media", "Sedang membersihkan cache gambar...", "fa-solid fa-trash-can animate-spin text-rose-500");
  try {
    if ('caches' in window) {
      const mediaCache = await caches.open('meb-media-cache');
      const keys = await mediaCache.keys();
      await Promise.all(keys.map(request => mediaCache.delete(request)));
      showModal("Cache Dihapus", "Seluruh cache gambar media berhasil dihapus.", "fa-solid fa-check-circle text-emerald-500");
    } else {
      showModal("Tidak Didukung", "Browser Anda tidak mendukung Cache Storage API.", "fa-solid fa-exclamation-triangle text-amber-500");
    }
  } catch (err) {
    showModal("Gagal Menghapus", `Terjadi kesalahan: ${err.message}`, "fa-solid fa-times-circle text-rose-500");
  }
}

export async function downloadAllPustakaForOffline() {
  if (!appState.currentUser || appState.isMockMode) {
    showModal("Akses Ditolak", "Login diperlukan untuk mengunduh pustaka secara offline.", "fa-solid fa-user-lock text-rose-500");
    return;
  }

  showModal("Download Offline", "Memulai sinkronisasi data pustaka...", "fa-solid fa-cloud-arrow-down text-brand-600");
  updateModalProgress(10);

  try {
    showModal("Download Offline", "Sedang mengunduh daftar pustaka...", "fa-solid fa-database animate-pulse text-brand-600");
    await pullSystemDataFromServer();
    updateModalProgress(30);

    showModal("Download Offline", "Sedang menyelaraskan kamus personal Anda...", "fa-solid fa-user-graduate animate-pulse text-brand-600");
    await pullUserKamusFromServer();
    updateModalProgress(50);

    showModal("Download Offline", "Mengunduh aset gambar dan media pendukung...", "fa-solid fa-image animate-pulse text-brand-600");

    const mediaUrls = [];
    appState.pustaka.forEach(item => {
      if (item.Gambar_Teks && item.Gambar_Teks.startsWith('http')) {
        mediaUrls.push(item.Gambar_Teks);
      }
    });

    const uniqueUrls = [...new Set(mediaUrls)];
    if (uniqueUrls.length > 0) {
      const mediaCache = await caches.open('meb-media-cache');
      let downloaded = 0;
      for (const url of uniqueUrls) {
        try {
          await mediaCache.add(url);
        } catch (e) {
          console.warn(`[Offline] Gagal mengunduh aset: ${url}`, e);
        }
        downloaded++;
        const progress = 50 + ((downloaded / uniqueUrls.length) * 50);
        updateModalProgress(Math.floor(progress));
      }
    }

    updateModalProgress(100);
    showModal("Selesai", "Seluruh naskah dan media berhasil disimpan secara offline.", "fa-solid fa-circle-check text-emerald-500");
  } catch (err) {
    console.error("[Offline] Gagal download:", err);
    showModal("Gagal", "Kendala jaringan terdeteksi. Silakan coba lagi nanti.", "fa-solid fa-wifi text-rose-500");
  }
}

// ============================================================
// --- NOTIFIKASI & SYNC SISTEM ---
// ============================================================

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    showModal("Tidak Didukung", "Browser Anda tidak mendukung notifikasi desktop.", "fa-solid fa-circle-xmark text-rose-500");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    sendLocalNotification("Notifikasi Aktif", "Anda akan menerima pengingat untuk sesi Leitner dan status backup.");
    setupPeriodicSync();
  } else {
    showModal("Izin Ditolak", "Anda tidak akan menerima notifikasi dari aplikasi ini.", "fa-solid fa-bell-slash text-slate-400");
  }
}

export function sendLocalNotification(title, body) {
  if (Notification.permission === "granted") {
    const options = {
      body: body,
      icon: "https://cdn-icons-png.flaticon.com/512/3389/3389081.png",
      badge: "https://cdn-icons-png.flaticon.com/512/3389/3389081.png",
      vibrate: [100, 50, 100]
    };

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    } else {
      new Notification(title, options);
    }
  }
}

export async function setupPeriodicSync() {
  if ('serviceWorker' in navigator && 'periodicSync' in registration) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync',
      });

      if (status.state === 'granted') {
        await registration.periodicSync.register('leitner-reminder', {
          minInterval: 24 * 60 * 60 * 1000,
        });
        console.log("[PWA] Periodic Sync berhasil didaftarkan.");
      }
    } catch (error) {
      console.error("[PWA] Gagal mendaftarkan Periodic Sync:", error);
    }
  } else {
    console.log("[PWA] Browser tidak mendukung Periodic Background Sync.");
  }
}

export function checkLeitnerReminders() {
  const now = new Date();
  const dueCount = appState.kamusUser.filter(item =>
    item.Status_Belajar !== 'Known' &&
    new Date(item.Tanggal_Review_Berikutnya) <= now
  ).length;

  if (dueCount > 0) {
    sendLocalNotification("Sesi Leitner Siap", `Ada ${dueCount} kosakata yang perlu Anda tinjau hari ini.`);
  }
}

// ============================================================
// --- API & INTEGRASI SETTINGS ---
// ============================================================

export function saveApiEndpoint() {
  const url = document.getElementById('api-endpoint-url').value.trim();
  if (url === "") {
    appState.gasEndpoint = "";
    appState.isMockMode = true;
    localStorage.removeItem('meb_gas_endpoint');
    document.getElementById('connection-status-tag').textContent = "Mock Data (Offline Mode)";
    document.getElementById('connection-status-tag').className = "text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 uppercase tracking-wide";
    document.getElementById('btn-sync-manual').classList.add('hidden');
    showModal("Mode Offline Diaktifkan", "Endpoint kosong, sistem kembali menggunakan simulasi database browser.", "fa-solid fa-circle-info text-slate-500");
  } else if (url.startsWith("https://script.google.com/macros/s/")) {
    appState.gasEndpoint = url;
    appState.isMockMode = false;
    localStorage.setItem('meb_gas_endpoint', url);
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

export async function testApiConnection() {
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