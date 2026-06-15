/**
 * MODUL UTAMA APLIKASI USER (USER APP MODULE)
 * Versi: v0.5.7-alpha (Fase 2 - Modular)
 * ID Unik: MEB-USER-APP-001
 *
 * Modul ini mengelola:
 * - State utama aplikasi (appState)
 * - Database Mock (data offline fallback)
 * - Inisialisasi halaman (window.onload)
 * - Manajemen autentikasi user (login, register, logout)
 * - Logika bisnis inti (handleWordClick, saveWordToPersonalKamus, dll.)
 * - Manajemen sesi Leitner (submitLeitnerResult, nextLeitnerCard)
 * - Konfigurasi backend API (saveApiEndpoint, testApiConnection)
 *
 * DEPENDENSI (harus dimuat sebelum modul ini):
 *   1. shared/arabic_utils.js  → cleanArabicHarakat, normalizeArabic, getVocalizedWord (moved from here)
 *   2. js/user_api.js          → apiCall, pullSystemDataFromServer, pullUserKamusFromServer
 *   3. js/user_ui.js           → switchView, renderLibrary, updateDashboardStats, dll.
 */ // Removed getVocalizedWord from here, as it's now in user_ui.js

import { apiCall, pullSystemDataFromServer, pullUserKamusFromServer, fetchExerciseData, fetchExerciseScoreHistory } from './user_api.js';
import { switchView, renderLibrary, updateDashboardStats, setupUserInterface, showModal, showSpinnerButton, toggleDarkMode, renderKamusTable, loadReader, showDictModal, hideDictModal, buildDynamicModeBLayout, loadLeitnerCard, revealLeitnerCard, closeLeitnerSession, filterKamusByBox, toggleAuthMode, filterLibrary, searchLibrary, adjustReaderFont, resetReaderSettings, adjustReaderLineHeight, toggleTranslation, closeModal } from './user_ui.js';
import { cleanArabicHarakat, normalizeArabic } from '../shared/arabic_utils.js';
// Import modul lain jika sudah dipisah (Contoh: import { setupUserInterface } from './user_ui.js';)

// ============================================================
// 0. STATE UTAMA APLIKASI
// ============================================================
const appId = typeof __app_id !== 'undefined' ? __app_id : 'meb-ext-reader';
const isModule = true;

let appState = {
  gasEndpoint: localStorage.getItem('meb_gas_endpoint') || '',
  isMockMode: !localStorage.getItem('meb_gas_endpoint'), // Initialize based on whether an endpoint is saved
  currentUser: JSON.parse(localStorage.getItem('meb_user')) || null,
  pustaka: [],
  petaKosakata: [],
  kataInduk: [],
  sambungan: [],
  kamusUser: [],
  currentReadingText: null,
  activeWordSelected: null,
  isAuthRegister: false,
  selectedBoxFilter: 'semua',
  readerFontSize: Number(localStorage.getItem('meb_reader_font_size') || 36),
  readerLineHeight: Number(localStorage.getItem('meb_reader_line_height') || 3.2),
  leitnerSessionWords: [],
  leitnerSessionIndex: 0,
  leitnerReviewResults: [], // Array to store results for bulk submission
  exerciseScoreHistory: [], // Riwayat skor latihan untuk himpunan aktif
  // --- Ekstensi Fitur Latihan Soal ---
  currentExerciseType: 'multiple_choice', // Jenis latihan aktif
  currentExerciseSetId: null,             // ID Himpunan Latihan (ID_Himpunan_Latihan)
  currentQuestionIndex: 0,                // Indeks soal saat ini dalam himpunan
  judulHimpunanLatihan: [],               // Daftar metadata himpunan latihan
  currentQuestionData: null,              // Objek data soal yang sedang aktif
  exerciseMode: 'read',                   // Mode aktif: 'read' (eksplorasi) atau 'challenge' (jawab)
  exerciseQuestions: [],                  // Array berisi seluruh soal dalam satu himpunan
  userAnswers: []                         // Rekaman jawaban pengguna di Mode Tantangan
};

// Proxy debugging untuk memantau perubahan appState di Console
if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
  appState = new Proxy(appState, {
    set(target, key, value) {
      console.log(`%c[STATE] %c${key}:`, 'color: #14b8a6; font-weight: bold', 'color: #64748b', value);
      target[key] = value;
      return true;
    }
  });
}

// Ekspos ke window untuk debugging console dan kompatibilitas onclick di HTML
window.appState = appState;

// Fungsi-fungsi dari user_app.js yang dipanggil langsung dari HTML
window.logout = logout;
window.handleAuthSubmit = handleAuthSubmit;
window.bypassLogin = bypassLogin;
window.handleAvatarClick = handleAvatarClick;
window.loadMockData = loadMockData;
window.handleWordClick = handleWordClick;
window.markReadAsFinished = markReadAsFinished;
window.saveWordToPersonalKamus = saveWordToPersonalKamus;
window.deleteKamusWord = deleteKamusWord; // Ini sudah benar
window.hideDictModal = hideDictModal; // Ekspos fungsi baru untuk menyembunyikan modal
window.saveApiEndpoint = saveApiEndpoint;
window.testApiConnection = testApiConnection;

// Fungsi-fungsi dari user_ui.js yang dipanggil langsung dari HTML
window.switchView = switchView;
window.toggleAuthMode = toggleAuthMode;
window.filterLibrary = filterLibrary;
window.searchLibrary = searchLibrary;
window.adjustReaderFont = adjustReaderFont;
window.resetReaderSettings = resetReaderSettings;
window.adjustReaderLineHeight = adjustReaderLineHeight;
window.toggleTranslation = toggleTranslation;
window.filterKamusByBox = filterKamusByBox;
window.closeModal = closeModal; // Ini untuk modal umum, bukan modal kamus
window.closeLeitnerSession = closeLeitnerSession;
window.revealLeitnerCard = revealLeitnerCard;
window.startLeitnerSession = startLeitnerSession; // Jika ada tombol di index.html
window.submitLeitnerResult = submitLeitnerResult; // Jika ada tombol di index.html
window.pullSystemDataFromServer = pullSystemDataFromServer;
window.pullUserKamusFromServer = pullUserKamusFromServer;

// Export appState for other modules to import
export { appState };

// Export functions that are still called directly from HTML onclick attributes (for other modules to import)
// (This is a temporary bridge until all onclicks are replaced with addEventListener in main.js)
export { logout, handleAuthSubmit, bypassLogin, handleAvatarClick, loadMockData, handleWordClick, markReadAsFinished, saveWordToPersonalKamus, deleteKamusWord, startLeitnerSession, submitLeitnerResult, nextLeitnerCard, saveApiEndpoint, testApiConnection };

// ============================================================
// 1. DATABASE MOCK (FALLBACK OFFLINE)
// ============================================================
const MOCK_PUSTAKA = [
  {
    ID_Teks: "TX-20260601-1",
    Seri: "Hewan & Alam",
    Judul_Teks_Arab: "الأَسَدُ الحَكِيمُ",
    Terjemah_Judul_Indonesia: "Singa yang Bijaksana",
    Konten_Arab: "فِي غَابَةٍ صَغِيرَةٍ، كَانَ الأَسَدُ الحَكِيمُ يَحْمِي الحَيَوَانَاتِ مِنَ الخَطَرِ الكَبِيرِ.",
    Terjemah_Indonesia: "Di sebuah hutan kecil, singa yang bijaksana melindungi hewan-hewan dari bahaya besar.",
    Tingkat_Kesulitan: "pemula"
  },
  {
    ID_Teks: "TX-20260601-2",
    Seri: "Kisah Sahabat",
    Judul_Teks_Arab: "شِرَاءُ البَيْتِ فِي الجَنَّةِ",
    Terjemah_Judul_Indonesia: "Membeli Rumah di Surga",
    Konten_Arab: "ذَهَبَ الصَّحَابِيُّ الكَرِيمُ إِلَى مَدِينَةِ مُنَوَّرَةِ لِيُسَاعِدَ الفُقَرَاءَ بِأَمْوَالِهِ الكَثِيرَةِ.",
    Terjemah_Indonesia: "Sahabat yang mulia pergi ke Madinah Munawwarah untuk membantu orang-orang fakir dengan hartanya yang melimpah.",
    Tingkat_Kesulitan: "menengah"
  }
];

const MOCK_PETA_KOSAKATA = [
  { ID_Kosakata: "VOC-001", ID_Teks: "TX-20260601-1", Kata_Teks: "أَسَدٌ", Kata_Teks_Polos: "أسد", Arti_Kata_Teks: "singa", ID_Kata_Induk: "IND-101", Sambungan_Awal_1: "", Sambungan_Awal_2: "", Sambungan_Awal_3: "", Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" },
  { ID_Kosakata: "VOC-002", ID_Teks: "TX-20260601-1", Kata_Teks: "الأَسَدُ", Kata_Teks_Polos: "الأسد", Arti_Kata_Teks: "singa itu", ID_Kata_Induk: "IND-101", Sambungan_Awal_1: "CON-01", Sambungan_Awal_2: "", Sambungan_Awal_3: "", Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" },
  { ID_Kosakata: "VOC-003", ID_Teks: "TX-20260601-2", Kata_Teks: "لِيُسَاعِدَ", Kata_Teks_Polos: "ليساعد", Arti_Kata_Teks: "agar dia menolong", ID_Kata_Induk: "IND-102", Sambungan_Awal_1: "CON-03", Sambungan_Awal_2: "CON-04", Sambungan_Awal_3: "", Sambungan_Akhir_1: "", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" },
  { ID_Kosakata: "VOC-004", ID_Teks: "TX-20260601-2", Kata_Teks: "بِأَمْوَالِهِ", Kata_Teks_Polos: "بأمواله", Arti_Kata_Teks: "dengan hartanya", ID_Kata_Induk: "IND-103", Sambungan_Awal_1: "CON-02", Sambungan_Awal_2: "", Sambungan_Awal_3: "", Sambungan_Akhir_1: "CON-05", Sambungan_Akhir_2: "", Sambungan_Akhir_3: "" }
];

const MOCK_KATA_INDUK = [
  { ID_Kata_Induk: "IND-101", Kata_Induk: "أَسَدٌ", Kata_Induk_Polos: "أسد", Arti_Kata_Induk: "singa (hewan buas)", Kategori: "Nomina" },
  { ID_Kata_Induk: "IND-102", Kata_Induk: "سَاعَدَ", Kata_Induk_Polos: "ساعد", Arti_Kata_Induk: "menolong / membantu", Kategori: "Verba" },
  { ID_Kata_Induk: "IND-103", Kata_Induk: "مَالٌ", Kata_Induk_Polos: "مال", Arti_Kata_Induk: "harta / uang", Kategori: "Nomina" }
];

const MOCK_SAMBUNGAN = [
  { ID_Sambungan: "CON-01", Bentuk_Sambungan: "ال", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Definite Article", Keterangan: "Membuat kata menjadi khusus." },
  { ID_Sambungan: "CON-02", Bentuk_Sambungan: "بـ", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Preposisi", Keterangan: "Artinya 'dengan'." },
  { ID_Sambungan: "CON-03", Bentuk_Sambungan: "لـ", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Preposisi / Harf", Keterangan: "Artinya 'untuk' atau 'agar'." },
  { ID_Sambungan: "CON-04", Bentuk_Sambungan: "يـ", Letak_Sambungan: "awal", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Mudharah", Keterangan: "Menunjukkan kata kerja masa kini laki-laki." },
  { ID_Sambungan: "CON-05", Bentuk_Sambungan: "ه", Letak_Sambungan: "akhir", Jenis_Sambungan: "imbuhan otomatis", Fungsi_Sambungan: "Pronomina Kepemilikan", Keterangan: "Artinya 'nya'." }
];

// ============================================================
// 3. MANAJEMEN OTENTIKASI USER
// ============================================================

/**
 * Menangani submit form login / registrasi
 * @param {Event} event - Event submit formulir
 */
async function handleAuthSubmit(event) {
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
      }, 5, 1000); // Pass retries and delay

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

/**
 * Masuk sebagai tamu tanpa akun (mode bypass)
 */
function bypassLogin() {
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

/**
 * Keluar dari sesi dan membersihkan data lokal
 */
function logout() {
  appState.currentUser = null;
  localStorage.removeItem('meb_user');
  localStorage.removeItem('meb_local_kamus');
  appState.kamusUser = [];

  document.getElementById('sidebar-name').textContent = "Guest Mode";
  document.getElementById('sidebar-avatar').textContent = "G";
  document.getElementById('sidebar-logout-btn').classList.add('hidden');
  document.getElementById('header-avatar').textContent = "G";

  switchView('login');
}

/**
 * Menangani klik pada avatar. Jika dalam mode guest, arahkan ke login.
 */
function handleAvatarClick() {
  if (!appState.currentUser || appState.currentUser.userId === 'USR-GUEST') {
    logout(); // Membersihkan sesi guest dan beralih ke tampilan login
  }
}

// ============================================================
// 4. MANAJEMEN DATABASE MOCK & DATA LOKAL
// ============================================================

/**
 * Memuat data mock ke appState sebagai fallback mode offline
 * @param {boolean} clear - Jika true, hapus kamus lokal terlebih dahulu
 */
async function loadMockData(clear) {
  if (clear) {
    localStorage.removeItem('meb_local_kamus');
    appState.kamusUser = [];
    showModal("Database Reset", "Mock data direset ke kondisi default.", "fa-solid fa-database text-amber-500");
  }
  appState.pustaka = MOCK_PUSTAKA;
  appState.petaKosakata = MOCK_PETA_KOSAKATA;
  appState.kataInduk = MOCK_KATA_INDUK;
  appState.sambungan = MOCK_SAMBUNGAN;

  if (appState.currentUser) {
    const localKamus = localStorage.getItem('meb_local_kamus');
    if (localKamus) {
      appState.kamusUser = JSON.parse(localKamus);
    } else {
      appState.kamusUser = [];
    }
  }
  renderLibrary();
  updateDashboardStats();
}

// ============================================================
// 5. INTERAKSI PEMBACA KATA (WORD CLICK & KAMUS MODAL)
// ============================================================

/**
 * Menangani klik pada kata Arab di reader — membuka modal kamus pintar
 * @param {string} arabicWordWithHarakat - Kata Arab yang diklik (beserta harakat)
 */
function handleWordClick(arabicWordWithHarakat) {
  const cleanWordWithHarakat = arabicWordWithHarakat
    .replace(/[.,\/#!$%\^\&\*;:{}=\-_`~()؟،]/g,"")
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

  showDictModal(); // Ini akan menampilkan modal
}

// ============================================================
// 6. EVALUASI MEMBACA & PROGRES KAMUS PERSONAL
// ============================================================

/**
 * Menandai teks bacaan aktif sebagai selesai dibaca
 */
async function markReadAsFinished() {
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

/**
 * Menyimpan kata yang dipilih ke Kamus Leitner pribadi
 */
async function saveWordToPersonalKamus() {
  if (!appState.activeWordSelected || !appState.currentUser) return;

  const userId = appState.currentUser.userId;
  const wordPolos = appState.activeWordSelected.polos;
  const idKataInduk = appState.activeWordSelected.idKataInduk || "IND-NASKAH";
  const customMeaning = document.getElementById('dict-custom-meaning').value.trim();

  if (appState.isMockMode) {
    const exist = appState.kamusUser.some(k => k.Kata_Polos === wordPolos && k.ID_User === userId);
    if (exist) {
      showModal("Kosakata Tersimpan", "Kata ini sudah ada di daftar belajar Leitner Anda.", "fa-solid fa-circle-exclamation text-amber-500");
      return;
    }

    const newWord = {
      ID_User_Word: "VOC-" + Math.floor(100000 + Math.random() * 900000),
      ID_User: userId,
      Kata_Polos: wordPolos,
      ID_Kata_Induk: idKataInduk,
      Arti_Kustom: customMeaning,
      Status_Belajar: 1,
      Tanggal_Simpan: new Date().toISOString(),
      Tanggal_Review_Berikutnya: new Date(Date.now() + 86400000).toISOString(),
      Streak_Benar: 0
    };

    appState.kamusUser.push(newWord);
    localStorage.setItem('meb_local_kamus', JSON.stringify(appState.kamusUser));
    updateDashboardStats();

    if (appState.currentReadingText) {
      loadReader(appState.currentReadingText.ID_Teks);
    }

    hideDictModal(); // Sembunyikan modal setelah menyimpan
    showModal("Berhasil Menyimpan", `"${appState.activeWordSelected.withHarakat}" dimasukkan ke Box 1 Kamus Leitner Anda.`, "fa-solid fa-folder-plus text-teal-600");
  } else {
    try {
      showSpinnerButton('btn-save-vocab', true);
      const res = await apiCall({
        action: "addWordToKamus",
        userId: userId,
        idKataInduk: idKataInduk,
        kataPolos: wordPolos,
        artiKustom: customMeaning
      });
      if (res.success) {
        const serverWord = {
          ID_User_Word: res.idUserWord,
          ID_User: userId,
          Kata_Polos: wordPolos,
          ID_Kata_Induk: idKataInduk,
          Arti_Kustom: customMeaning,
          Status_Belajar: 1,
          Tanggal_Simpan: new Date().toISOString(),
          Tanggal_Review_Berikutnya: new Date(Date.now() + 86400000).toISOString(),
          Streak_Benar: 0
        };
        appState.kamusUser.push(serverWord);
        localStorage.setItem('meb_local_kamus', JSON.stringify(appState.kamusUser));
        updateDashboardStats();

        if (appState.currentReadingText) {
          loadReader(appState.currentReadingText.ID_Teks);
        }

        hideDictModal(); // Sembunyikan modal setelah menyimpan
        showModal("Sinkronisasi Sukses", "Kata tersimpan ke Google Sheets & siap dipelajari.", "fa-solid fa-cloud-arrow-up text-brand-600");
      } else {
        showModal("Gagal Menyimpan", res.error, "fa-solid fa-circle-xmark text-red-500");
      }
    } catch (err) {
      showModal("Gagal Menghubungi Server", err.toString(), "fa-solid fa-triangle-exclamation text-amber-500");
    } finally {
      showSpinnerButton('btn-save-vocab', false, "Masukkan ke Kamus Leitner");
    }
  }
}

// ============================================================
// 7. MANAJEMEN TABEL & SESI LEITNER
// ============================================================

/**
 * Menghapus kosakata dari kamus personal
 * @param {string} idUserWord - ID unik entri kamus yang akan dihapus
 */
function deleteKamusWord(idUserWord) {
  appState.kamusUser = appState.kamusUser.filter(item => item.ID_User_Word !== idUserWord);
  localStorage.setItem('meb_local_kamus', JSON.stringify(appState.kamusUser));
  renderKamusTable(appState.selectedBoxFilter);
  updateDashboardStats();
  showModal("Dihapus", "Kosakata berhasil dihilangkan dari kamus personal Anda.", "fa-solid fa-trash-arrow-up text-rose-500");
}

/**
 * Memulai sesi review flashcard Leitner
 */
function startLeitnerSession() {
  let dueWords = appState.kamusUser.filter(item => item.Status_Belajar !== 'Known');

  if (dueWords.length === 0) {
    showModal("Latihan Selesai", "Kamus Anda kosong atau semua kosakata Anda telah bertatus 'Known'!", "fa-solid fa-circle-check text-emerald-500");
    return;
  }

  appState.leitnerSessionWords = dueWords;
  appState.leitnerSessionIndex = 0;

  document.getElementById('leitner-modal').classList.remove('hidden');
  loadLeitnerCard();
}

/**
 * Memproses hasil jawaban pada kartu Leitner aktif
 * @param {boolean} isCorrect - True jika user menjawab benar
 */
async function submitLeitnerResult(isCorrect) {
  const word = appState.leitnerSessionWords[appState.leitnerSessionIndex];

  if (appState.isMockMode) {
    // Existing mock mode logic
    const itemIndex = appState.kamusUser.findIndex(k => k.ID_User_Word === word.ID_User_Word);
    if (itemIndex !== -1) {
      const current = appState.kamusUser[itemIndex];
      if (isCorrect) {
        current.Streak_Benar++;
        if (current.Status_Belajar < 5) {
          current.Status_Belajar = Number(current.Status_Belajar) + 1; // Ensure it's a number
        } else {
          current.Status_Belajar = 'Known';
        }
      } else {
        current.Status_Belajar = 1; // Reset to Box 1
        current.Streak_Benar = 0;
      }
      // Calculate next review date based on Leitner box system
      const reviewIntervals = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 'Known': 30 }; // Days for review intervals
      const nextReviewDays = reviewIntervals[current.Status_Belajar] || 1; // Default to 1 day if not found
      current.Tanggal_Review_Berikutnya = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000).toISOString();
    } //
    localStorage.setItem('meb_local_kamus', JSON.stringify(appState.kamusUser));
    nextLeitnerCard();
  } else {
    // Pastikan hasil disimpan sebagai objek bersih untuk bulk submission
    if (word && word.ID_User_Word) {
      appState.leitnerReviewResults.push({
        idUserWord: word.ID_User_Word,
        isCorrect: isCorrect === true
      });
    }

    // Update local kamusUser immediately for UI consistency (similar to mock mode logic)
    const itemIndex = appState.kamusUser.findIndex(k => k.ID_User_Word === word.ID_User_Word);
    if (itemIndex !== -1) {
      const current = appState.kamusUser[itemIndex];
      // Apply Leitner box logic locally
      if (isCorrect) {
        current.Streak_Benar++;
        if (current.Status_Belajar < 5) {
          current.Status_Belajar = Number(current.Status_Belajar) + 1; // Ensure it's a number
        } else {
          current.Status_Belajar = 'Known';
        }
      } else {
        current.Status_Belajar = 1; // Reset to Box 1
        current.Streak_Benar = 0;
      }
      // Calculate next review date based on Leitner box system
      const reviewIntervals = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16, 'Known': 30 }; // Days for review intervals
      const nextReviewDays = reviewIntervals[current.Status_Belajar] || 1; // Default to 1 day if not found
      current.Tanggal_Review_Berikutnya = new Date(Date.now() + nextReviewDays * 24 * 60 * 60 * 1000).toISOString();
    }
    localStorage.setItem('meb_local_kamus', JSON.stringify(appState.kamusUser));
    nextLeitnerCard();
  }
}

/**
 * Berpindah ke kartu Leitner berikutnya atau menyelesaikan sesi
 */
async function nextLeitnerCard() { // Made async to await apiCall
  appState.leitnerSessionIndex++;
  if (appState.leitnerSessionIndex < appState.leitnerSessionWords.length) {
    loadLeitnerCard();
  } else {
    // Panggil penutup sesi yang akan menangani sinkronisasi terakhir secara otomatis
    await closeLeitnerSession();

    updateDashboardStats();
    if (appState.currentReadingText) {
      loadReader(appState.currentReadingText.ID_Teks);
    }
  }
}

// ============================================================
// 8. KONFIGURASI BACKEND API GOOGLE APPS SCRIPT
// ============================================================

/**
 * Menyimpan endpoint Google Apps Script dan memulai sinkronisasi
 */
function saveApiEndpoint() {
  const url = document.getElementById('api-endpoint-url').value.trim();
  if (url === "") {
    appState.gasEndpoint = "";
    appState.isMockMode = true;
    localStorage.removeItem('meb_gas_endpoint');
    document.getElementById('connection-status-tag').textContent = "Mock Data (Offline Mode)";
    document.getElementById('connection-status-tag').className = "text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 uppercase tracking-wide"; //
    document.getElementById('btn-sync-manual').classList.add('hidden'); //
    userUi.showModal("Mode Offline Diaktifkan", "Endpoint kosong, sistem kembali menggunakan simulasi database browser.", "fa-solid fa-circle-info text-slate-500");
  } else if (url.startsWith("https://script.google.com/macros/s/")) { // Lebih spesifik untuk URL Apps Script
    appState.gasEndpoint = url;
    appState.isMockMode = false;
    localStorage.setItem('meb_gas_endpoint', url);
    document.getElementById('connection-status-tag').textContent = "Sinkron Server Aktif";
    document.getElementById('connection-status-tag').className = "text-[10px] font-extrabold px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide"; //
    document.getElementById('btn-sync-manual').classList.remove('hidden'); //

    // These functions are in user_api.js, so they need to be imported and then called.
    pullSystemDataFromServer();
    pullUserKamusFromServer();

    showModal("Endpoint Disimpan", "Koneksi Google Apps Script berhasil ditargetkan dan sinkronisasi dimulai.", "fa-solid fa-cloud-arrow-up text-teal-600");
  } else {
    showModal("Format URL Salah", "Gunakan URL Web App resmi Google Apps Script.", "fa-solid fa-triangle-exclamation text-rose-500");
  }
}

/**
 * Menguji koneksi ke Google Apps Script backend
 */
async function testApiConnection() {
  if (appState.isMockMode || !appState.gasEndpoint) {
    showModal("Koneksi Batal", "Silakan atur URL Jembatan Integrasi di atas terlebih dahulu.", "fa-solid fa-triangle-exclamation text-amber-500");
    return;
  }

  showModal("Menguji Koneksi", "Menghubungi web app Google Sheets...", "fa-solid fa-circle-notch animate-spin text-brand-600");

  try {
    const response = await fetch(`${appState.gasEndpoint}?action=initDatabase`); //
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
