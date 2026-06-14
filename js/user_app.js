/**
 * MODUL APLIKASI UTAMA (USER)
 * Versi: v0.5.5-alpha
 * ID Unik: MEB-USER-APP-001
 * * Modul ini mengelola state global aplikasi, data mock, dan orkestrasi antar modul UI dan API.
 */

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker terdaftar', reg))
      .catch(err => console.log('Pendaftaran SW gagal', err));
  });
}

// --- 0. STATE UTAMA APLIKASI ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'meb-ext-reader';
let appState = {
  gasEndpoint: getFromLocalStorage('meb_gas_endpoint', ''),
  isMockMode: true, 
  currentUser: null,
  pustaka: [],
  petaKosakata: [],
  kataInduk: [],
  sambungan: [],
  kamusUser: [],
  currentReadingText: null,
  activeWordSelected: null,
  selectedBoxFilter: 'semua',
  readerFontSize: getFromLocalStorage('meb_reader_font_size', 36),
  readerLineHeight: getFromLocalStorage('meb_reader_line_height', 3.2),
  leitnerSessionWords: [],
  leitnerSessionIndex: 0
};

// --- GRADASI WARNA ADAPTIF LEITNER BOX ---
const LEITNER_THEME = {
  1: {
    text: "text-rose-700 dark:text-rose-300",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-b-2 border-rose-400 dark:border-rose-750",
    hover: "hover:bg-rose-100/60 dark:hover:bg-rose-900/20"
  },
  2: {
    text: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-b-2 border-amber-400 dark:border-amber-750",
    hover: "hover:bg-amber-100/60 dark:hover:bg-amber-900/20"
  },
  3: {
    text: "text-yellow-700 dark:text-yellow-300",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
    border: "border-b-2 border-yellow-400 dark:border-yellow-750",
    hover: "hover:bg-yellow-100/60 dark:hover:bg-yellow-900/20"
  },
  4: {
    text: "text-sky-700 dark:text-sky-300",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-b-2 border-sky-400 dark:border-sky-750",
    hover: "hover:bg-sky-100/60 dark:hover:bg-sky-900/20"
  },
  5: {
    text: "text-indigo-700 dark:text-indigo-300",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-b-2 border-indigo-400 dark:border-indigo-750",
    hover: "hover:bg-indigo-100/60 dark:hover:bg-indigo-900/20"
  },
  "Known": {
    text: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-b-2 border-emerald-400 dark:border-emerald-750",
    hover: "hover:bg-emerald-100/60 dark:hover:bg-emerald-900/20"
  }
};

// --- MOCK DATABASE FALLBACK ---
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
    Judul_Teks_Arab: "شِرَاءُ البَيْتِ فِي الجَنَّةِ",
    Terjemah_Judul_Indonesia: "Membeli Rumah di Surga",
    Konten_Arab: "ذَهَبَ الصَّحَابِيُّ الكَرِيمُ إِلَى مَدِينَةِ Mُنَوَّرَةِ لِيُسَاعِدَ الفُقَرَاءَ بِأَمْوَالِهِ الكَثِيرَةِ.",
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

// --- 1. INISIALISASI HALAMAN ---
window.onload = async function() {
  // Periksa preferensi mode gelap
  const darkModeSaved = getFromLocalStorage('dark_mode', null);
  if (darkModeSaved === true || (darkModeSaved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    const sidebarIcon = document.getElementById('theme-icon-sidebar');
    const mobileIcon = document.getElementById('theme-icon-mobile');
    if (sidebarIcon) sidebarIcon.className = 'fa-solid fa-sun';
    if (mobileIcon) mobileIcon.className = 'fa-solid fa-sun';
  }

  // Periksa simpanan Endpoint API
  const savedEndpoint = getFromLocalStorage('meb_gas_endpoint', '');
  if (savedEndpoint) {
    appState.gasEndpoint = savedEndpoint;
    appState.isMockMode = false;
    document.getElementById('api-endpoint-url').value = savedEndpoint;
    document.getElementById('connection-status-tag').textContent = "Sinkron Server Aktif";
    document.getElementById('connection-status-tag').className = "text-[10px] font-extrabold px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 uppercase tracking-wide";
    document.getElementById('btn-sync-manual').classList.remove('hidden');
  } else {
    appState.isMockMode = true;
    document.getElementById('connection-status-tag').textContent = "Mock Data (Offline Mode)";
    document.getElementById('connection-status-tag').className = "text-[10px] font-extrabold px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 uppercase tracking-wide";
    document.getElementById('btn-sync-manual').classList.add('hidden');
  }

  // Muat Data Pustaka Terlebih Dahulu
  await loadMockData(false);

  // Verifikasi login lokal pengguna
  const savedUser = getFromLocalStorage('meb_user', null);
  if (savedUser) {
    appState.currentUser = savedUser;
    setupUserInterface();
    
    if (!appState.isMockMode) {
      await pullSystemDataFromServer();
      await pullUserKamusFromServer();
    } else {
      appState.kamusUser = getFromLocalStorage('meb_local_kamus', []);
    }
    updateDashboardStats();
    switchView('library');
  } else {
    switchView('login');
  }
};

/**
 * Memuat data mock ke dalam appState atau dari localStorage.
 * @param {boolean} clear - Jika true, hapus kamus lokal sebelum memuat ulang.
 */
async function loadMockData(clear) {
  if (clear) {
    saveToLocalStorage('meb_local_kamus', []);
    appState.kamusUser = [];
    showModal("Database Reset", "Mock data direset ke kondisi default.", "fa-solid fa-database text-amber-500");
  }
  appState.pustaka = MOCK_PUSTAKA;
  appState.petaKosakata = MOCK_PETA_KOSAKATA;
  appState.kataInduk = MOCK_KATA_INDUK;
  appState.sambungan = MOCK_SAMBUNGAN;

  if (appState.currentUser) {
    appState.kamusUser = getFromLocalStorage('meb_local_kamus', []);
  }
  renderLibrary();
  updateDashboardStats();
}

/**
 * Mengambil bentuk kata bervokal dari item kosakata atau kata induk.
 * @param {Object} item - Objek kosakata dari kamus user atau peta kosakata.
 * @returns {string} Kata Arab dengan harakat atau polos.
 */
function getVocalizedWord(item) {
  if (!item) return "-";
  
  // Ambil relasi dari ID_Kata_Induk terlebih dahulu
  if (item.ID_Kata_Induk && item.ID_Kata_Induk !== "IND-NASKAH") {
    const parent = appState.kataInduk.find(ki => ki.ID_Kata_Induk === item.ID_Kata_Induk);
    if (parent) return parent.Kata_Induk;
  }
  
  // Ambil dari Peta Kosakata untuk harakat lengkap
  const mapping = appState.petaKosakata.find(m => {
    return normalizeArabic(m.Kata_Teks_Polos) === normalizeArabic(item.Kata_Polos) ||
           normalizeArabic(m.Kata_Teks) === normalizeArabic(item.Kata_Polos);
  });
  if (mapping) return mapping.Kata_Teks;

  return item.Kata_Polos; 
}

/**
 * Menandai teks yang sedang dibaca sebagai selesai.
 */
async function markReadAsFinished() {
  if (!appState.currentReadingText || !appState.currentUser) return;
  
  const userId = appState.currentUser.userId;
  const textId = appState.currentReadingText.ID_Teks;

  if (appState.isMockMode) {
    appState.currentUser.stats.teksDibaca = (appState.currentUser.stats.teksDibaca || 0) + 1;
    saveToLocalStorage('meb_user', appState.currentUser);
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
        saveToLocalStorage('meb_user', appState.currentUser);
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
 * Menyimpan kata yang dipilih ke kamus personal pengguna.
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
    saveToLocalStorage('meb_local_kamus', appState.kamusUser);
    updateDashboardStats();
    
    if (appState.currentReadingText) {
      loadReader(appState.currentReadingText.ID_Teks);
    }
    
    closeDictModal();
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
        
        closeDictModal();
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

/**
 * Mengirim hasil review Leitner Box ke backend atau memperbarui lokal.
 * @param {boolean} isCorrect - True jika jawaban benar, false jika salah.
 */
async function submitLeitnerResult(isCorrect) {
  const word = appState.leitnerSessionWords[appState.leitnerSessionIndex];
  
  if (appState.isMockMode) {
    const itemIndex = appState.kamusUser.findIndex(k => k.ID_User_Word === word.ID_User_Word);
    if (itemIndex !== -1) {
      const current = appState.kamusUser[itemIndex];
      if (isCorrect) {
        current.Streak_Benar++;
        if (current.Status_Belajar < 5) {
          current.Status_Belajar++;
        } else {
          current.Status_Belajar = 'Known';
        }
      } else {
        current.Status_Belajar = 1; 
        current.Streak_Benar = 0;
      }
      current.Tanggal_Review_Berikutnya = new Date(Date.now() + 86400000 * (isCorrect ? current.Status_Belajar : 1)).toISOString();
    }
        saveToLocalStorage('meb_local_kamus', appState.kamusUser);
    nextLeitnerCard();
  } else {
    try {
      const res = await apiCall({
        action: "reviewWord",
        userId: appState.currentUser.userId,
        idUserWord: word.ID_User_Word,
        isCorrect: isCorrect
      });
      if (res.success) {
        const itemIndex = appState.kamusUser.findIndex(k => k.ID_User_Word === word.ID_User_Word);
        if (itemIndex !== -1) {
          appState.kamusUser[itemIndex].Status_Belajar = res.nextBox;
          appState.kamusUser[itemIndex].Tanggal_Review_Berikutnya = res.nextReview;
          appState.kamusUser[itemIndex].Streak_Benar = res.streak;
        }
            saveToLocalStorage('meb_local_kamus', appState.kamusUser);
        nextLeitnerCard();
      }
    } catch (err) {
      showModal("Evaluasi Gagal", err.toString(), "fa-solid fa-triangle-exclamation text-red-500");
    }
  }
}

/**
 * Memperbarui statistik dashboard dan sidebar.
 */
function updateDashboardStats() {
  if (!appState.currentUser) return;

  const finishCount = appState.currentUser.stats ? appState.currentUser.stats.teksDibaca || 0 : 0;
  document.getElementById('stat-books').textContent = `${finishCount} Teks`;
  
  const vocabCount = appState.kamusUser ? appState.kamusUser.length : 0;
  document.getElementById('stat-vocab').textContent = `${vocabCount} Kata`;

  document.getElementById('sidebar-vocab-count').textContent = vocabCount;

  const sidebarLvl = document.getElementById('sidebar-level');
  const bannerLvlBadge = document.getElementById('banner-level-badge');
  const bannerTitle = document.querySelector('#view-library h2');

  if (isGuest && bannerTitle) {
    bannerTitle.textContent = "Mode Latihan Offline";
  } else if (bannerTitle) {
    bannerTitle.textContent = "Lanjutkan Membaca Ekstensif";
  }

  let levelLabel = "Level: Pre-A1";
  let levelColorClass = "text-[9px] font-extrabold text-pink-700 dark:text-pink-400 uppercase tracking-wide";

  if (vocabCount < 5) {
    levelLabel = "Level: Pre-A1";
    levelColorClass = "text-[9px] font-extrabold text-pink-700 dark:text-pink-400 uppercase tracking-wide";
  } else if (vocabCount < 15) {
    levelLabel = "Level: A1";
    levelColorClass = "text-[9px] font-extrabold text-brand-700 dark:text-brand-400 uppercase tracking-wide";
  } else {
    levelLabel = "Level: A2";
    levelColorClass = "text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide";
  }

  if (sidebarLvl) {
    sidebarLvl.textContent = levelLabel;
    sidebarLvl.className = levelColorClass;
  }
  if (bannerLvlBadge) bannerLvlBadge.textContent = levelLabel;

  if (appState.kamusUser) {
    document.getElementById('count-box-1').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 1).length;
    document.getElementById('count-box-2').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 2).length;
    document.getElementById('count-box-3').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 3).length;
    document.getElementById('count-box-4').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 4).length;
    document.getElementById('count-box-5').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 5).length;
    document.getElementById('count-box-known').textContent = appState.kamusUser.filter(k => k.Status_Belajar && k.Status_Belajar.toString() === "Known").length;
  }
}