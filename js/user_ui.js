/**
 * MODUL UI USER (USER UI MODULE)
 * Versi: v0.5.6-alpha (Fase 1 - Modular)
 * ID Unik: MEB-USER-UI-001
 * * Modul ini menangani seluruh rendering visual, manipulasi DOM,
 * pergantian screen (routing), pengaturan font/line-height, dan dialog modal.
 */

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

/**
 * Berpindah tampilan (view/screen) pada aplikasi pembaca
 * @param {string} viewName - Nama view ('login', 'library', 'reader', 'kamus', 'settings')
 */
function switchView(viewName) {
  // Jika belum masuk, paksa tetap di view-login (kecuali menu setting dibolehkan)
  if (!appState.currentUser && viewName !== 'login' && viewName !== 'settings') {
    viewName = 'login';
  }

  const views = ['login', 'library', 'reader', 'kamus', 'settings'];
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  });

  // Update kelas CSS tombol navigasi samping desktop
  const navBtns = {
    library: 'nav-library-btn',
    kamus: 'nav-kamus-btn',
    settings: 'nav-settings-btn'
  };
  Object.entries(navBtns).forEach(([key, id]) => {
    const btn = document.getElementById(id);
    if (btn) {
      if (key === viewName || (viewName === 'reader' && key === 'library')) {
        btn.className = "nav-btn w-full px-4 py-3 rounded-xl text-xs font-semibold bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 font-bold text-left flex items-center gap-3 transition";
      } else {
        btn.className = "nav-btn w-full px-4 py-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left flex items-center gap-3 transition";
      }
    }
  });

  // Update kelas CSS navigasi ponsel bawah
  const mobNavBtns = {
    library: 'mob-nav-library-btn',
    kamus: 'mob-nav-kamus-btn',
    settings: 'mob-nav-settings-btn'
  };
  Object.entries(mobNavBtns).forEach(([key, id]) => {
    const btn = document.getElementById(id);
    if (btn) {
      if (key === viewName || (viewName === 'reader' && key === 'library')) {
        btn.className = "flex flex-col items-center gap-0.5 px-4 py-1.5 text-brand-600 dark:text-brand-400 font-bold scale-105 transition";
      } else {
        btn.className = "flex flex-col items-center gap-0.5 px-4 py-1.5 text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition";
      }
    }
  });

  // Muat ulang tabel jika masuk ke menu Kamus
  if (viewName === 'kamus') {
    renderKamusTable(appState.selectedBoxFilter);
  } else if (viewName === 'library') {
    renderLibrary();
  }
}

/**
 * Mengubah tipe otentikasi login / register
 * @param {boolean} isRegister - True jika mendaftar baru
 */
function toggleAuthMode(isRegister) {
  isAuthRegister = isRegister;
  const title = document.getElementById('auth-title');
  const btn = document.getElementById('auth-submit-btn');
  const toggleText = document.getElementById('auth-toggle-text');

  if (isRegister) {
    title.textContent = "Daftar Akun Baru";
    btn.textContent = "Daftar Sekarang";
    toggleText.innerHTML = `Sudah punya akun? <a href="#" onclick="toggleAuthMode(false)" class="text-brand-600 dark:text-brand-400 font-bold hover:underline">Masuk</a>`;
  } else {
    title.textContent = "Masuk ke MEB Reader";
    btn.textContent = "Masuk Sekarang";
    toggleText.innerHTML = `Belum punya akun? <a href="#" onclick="toggleAuthMode(true)" class="text-brand-600 dark:text-brand-400 font-bold hover:underline">Daftar Baru</a>`;
  }
}

/**
 * Menyeting komponen nama dan visual user pada UI
 */
function setupUserInterface() {
  if (appState.currentUser) {
    // UI Sidebar Desktop
    document.getElementById('sidebar-name').textContent = appState.currentUser.username;
    document.getElementById('sidebar-avatar').textContent = appState.currentUser.username.substring(0,2).toUpperCase();
    document.getElementById('sidebar-logout-btn').classList.remove('hidden');

    // UI Header Mobile
    document.getElementById('header-avatar').textContent = appState.currentUser.username.substring(0,2).toUpperCase();

    document.getElementById('desktop-nav').classList.remove('hidden');
    document.getElementById('mobile-nav').classList.remove('hidden');
  }
}

/**
 * Me-render daftar buku bacaan pada perpustakaan
 * @param {string} filterDifficulty - Filter level kesulitan ('semua', 'pemula', 'menengah', 'mahir')
 */
function renderLibrary(filterDifficulty = 'semua') {
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';

  let list = appState.pustaka;
  if (filterDifficulty !== 'semua') {
    list = list.filter(item => item.Tingkat_Kesulitan && item.Tingkat_Kesulitan.toLowerCase() === filterDifficulty.toLowerCase());
  }

  if (!list || list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800">
        <i class="fa-solid fa-box-open text-4xl mb-3 opacity-40"></i>
        <p class="text-xs">Naskah tidak ditemukan untuk kategori tingkat ini.</p>
      </div>`;
    return;
  }

  list.forEach(text => {
    let diffColor = 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400';
    const difficulty = (text.Tingkat_Kesulitan || "pemula").toLowerCase();
    if (difficulty === 'menengah') diffColor = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400';
    if (difficulty === 'mahir') diffColor = 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400';

    const judulIndo = text.Judul_Teks || text.Terjemah_Judul_Indonesia || "Tanpa Judul";

    // --- PENGHITUNGAN METRIK STATISTIK ---
    const totalWords = text.Konten_Arab ? text.Konten_Arab.split(/\s+/).filter(Boolean).length : 0;

    // Menghitung Kata Unik: Scan isi teks dan validasi terhadap database Peta_Kosakata global yang memiliki ID_Kata_Induk
    const tokens = text.Konten_Arab ? text.Konten_Arab.split(/\s+/).filter(Boolean) : [];
    const validMappedSet = new Set();
    tokens.forEach(token => {
      const clean = normalizeArabic(token.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،]/g,""));
      if (!clean) return;
      
      const isMappable = appState.petaKosakata.some(m => 
        (normalizeArabic(m.Kata_Teks) === clean || normalizeArabic(m.Kata_Teks_Polos) === clean) && 
        m.ID_Kata_Induk
      );
      if (isMappable) validMappedSet.add(clean);
    });
    const uniqueCleanWordsCount = validMappedSet.size;

    const mappedItems = appState.petaKosakata.filter(m => m.ID_Teks === text.ID_Teks);

    const learningCount = appState.kamusUser ? appState.kamusUser.filter(ku => {
      const isLearning = [1, 2, 3, 4, 5].includes(Number(ku.Status_Belajar));
      if (!isLearning) return false;
      return mappedItems.some(mi => mi.Kata_Polos === ku.Kata_Polos || (mi.ID_Kata_Induk && mi.ID_Kata_Induk === ku.ID_Kata_Induk));
    }).length : 0;

    const knownCount = appState.kamusUser ? appState.kamusUser.filter(ku => {
      const isKnown = ku.Status_Belajar && (ku.Status_Belajar.toString().toLowerCase() === 'known');
      if (!isKnown) return false;
      return mappedItems.some(mi => mi.Kata_Polos === ku.Kata_Polos || (mi.ID_Kata_Induk && mi.ID_Kata_Induk === ku.ID_Kata_Induk));
    }).length : 0;

    const card = document.createElement('div');
    card.className = "bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 hover:shadow-md hover:border-brand-500/20 dark:hover:border-brand-500/10 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4";
    card.onclick = () => loadReader(text.ID_Teks);
    
    card.innerHTML = `
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">${text.Seri || "Umum"}</span>
          <span class="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${diffColor}">${difficulty}</span>
        </div>
        <div class="space-y-1">
          <h3 class="text-sm font-bold text-slate-850 dark:text-white leading-snug">${judulIndo}</h3>
          <h4 class="text-2xl font-bold font-arabic text-right text-brand-600 dark:text-brand-400 leading-normal" dir="rtl">${text.Judul_Teks_Arab || ""}</h4>
        </div>
      </div>
      
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px] text-slate-500 dark:text-slate-400">
        <div class="flex items-center gap-1.5">
          <i class="fa-solid fa-file-waveform text-slate-400 w-3.5"></i>
          <span>Total Kata: <strong>${totalWords}</strong></span>
        </div>
        <div class="flex items-center gap-1.5">
          <i class="fa-solid fa-cubes text-slate-400 w-3.5"></i>
          <span>Kata Unik: <strong>${uniqueCleanWordsCount}</strong></span>
        </div>
        <div class="flex items-center gap-1.5">
          <i class="fa-solid fa-graduation-cap text-amber-500 w-3.5"></i>
          <span>Belajar: <strong class="text-amber-600 dark:text-amber-400">${learningCount}</strong></span>
        </div>
        <div class="flex items-center gap-1.5">
          <i class="fa-solid fa-award text-emerald-500 w-3.5"></i>
          <span>Dikuasai: <strong class="text-emerald-600 dark:text-emerald-400">${knownCount}</strong></span>
        </div>
      </div>
      <div class="pt-2 border-t border-slate-50 dark:border-slate-800/40 flex justify-end text-[10px]">
        <span class="text-brand-650 dark:text-brand-400 font-extrabold hover:underline">Baca Sekarang <i class="fa-solid fa-arrow-right ml-0.5"></i></span>
      </div>`;
    grid.appendChild(card);
  });
}

/**
 * Memfilter tampilan buku berdasarkan tombol kesulitan
 */
function filterLibrary(difficulty) {
  document.querySelectorAll('#difficulty-filters button').forEach(btn => {
    btn.className = "diff-btn px-4 py-2 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 transition shrink-0";
  });
  event.target.className = "diff-btn px-4 py-2 rounded-full text-[11px] font-extrabold bg-brand-600 text-white shadow-sm shrink-0 transition";
  renderLibrary(difficulty);
}

/**
 * Mencari buku di library secara real-time
 */
function searchLibrary() {
  const q = document.getElementById('library-search').value.toLowerCase();
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';

  let list = appState.pustaka.filter(t => {
    const judulIndo = (t.Judul_Teks || t.Terjemah_Judul_Indonesia || "").toLowerCase();
    const judulArab = (t.Judul_Teks_Arab || "");
    const seri = (t.Seri || "").toLowerCase();
    return judulIndo.includes(q) || judulArab.includes(q) || seri.includes(q);
  });

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400">
        <p class="text-xs">Tidak ada judul yang cocok dengan "${q}".</p>
      </div>`;
    return;
  }
  renderLibrary();
}

/**
 * Memuat buku ke halaman pembaca E-Reader
 * @param {string} idTeks - ID Teks buku yang dipilih
 */
function loadReader(idTeks) {
  const text = appState.pustaka.find(p => p.ID_Teks === idTeks);
  if (!text) return;

  appState.currentReadingText = text;
  
  document.getElementById('reader-difficulty').textContent = (text.Tingkat_Kesulitan || "PEMULA").toUpperCase();
  document.getElementById('reader-title-id').textContent = text.Judul_Teks || text.Terjemah_Judul_Indonesia || "Tanpa Judul";
  document.getElementById('reader-title-ar').textContent = text.Judul_Teks_Arab;
  document.getElementById('reader-translation').textContent = text.Terjemah_Indonesia;

  const canvas = document.getElementById('reader-canvas');
  canvas.innerHTML = '';
  canvas.style.fontSize = `${appState.readerFontSize}px`;

  // Sinkronkan Slider UI dengan State Terkini
  const slider = document.getElementById('line-height-slider');
  if (slider) slider.value = appState.readerLineHeight;
  const sliderV = document.getElementById('line-height-slider-v');
  if (sliderV) sliderV.value = appState.readerLineHeight;

  const content = text.Konten_Arab || "";
  const rawSentences = content.split(/[.\n]+/);
  
  rawSentences.forEach((rawSentence) => {
    const trimmedSentence = rawSentence.trim();
    if (trimmedSentence.length === 0) return;

    const sentenceBlock = document.createElement('div');
    sentenceBlock.className = "sentence-block mb-8 pb-4 pr-4 border-r-4 border-brand-500/20 text-right transition-all duration-150";
    sentenceBlock.style.lineHeight = appState.readerLineHeight;
    sentenceBlock.dir = "rtl";

    const words = trimmedSentence.split(/(\s+)/);
    
    words.forEach(word => {
      if (word.trim().length === 0) {
        sentenceBlock.appendChild(document.createTextNode(word));
      } else {
        const span = document.createElement('span');
        span.textContent = word;

        const cleanWordWithHarakat = word
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟،]/g,"")
          .replace(/[\r\n]/g, "")
          .trim();
        const cleanWordPolos = cleanArabicHarakat(cleanWordWithHarakat);
        const targetNormal = normalizeArabic(cleanWordWithHarakat);

        let mapping = appState.petaKosakata.find(m => {
          if (!m) return false;
          return normalizeArabic(m.Kata_Teks) === targetNormal || normalizeArabic(m.Kata_Teks_Polos) === targetNormal;
        });

        if (!mapping) {
          const directRoot = appState.kataInduk.find(ki => {
            if (!ki) return false;
            return normalizeArabic(ki.Kata_Induk) === targetNormal || normalizeArabic(ki.Kata_Induk_Polos) === targetNormal;
          });
          if (directRoot) {
            mapping = { ID_Kata_Induk: directRoot.ID_Kata_Induk };
          }
        }

        let userWordStatus = null;
        if (appState.kamusUser) {
          const matchInKamus = appState.kamusUser.find(ku => {
            return ku.Kata_Polos === cleanWordPolos || (mapping && mapping.ID_Kata_Induk && ku.ID_Kata_Induk === mapping.ID_Kata_Induk);
          });
          if (matchInKamus) {
            userWordStatus = matchInKamus.Status_Belajar;
          }
        }

        if (userWordStatus && LEITNER_THEME[userWordStatus]) {
          const theme = LEITNER_THEME[userWordStatus];
          span.className = `word-span font-semibold shadow-sm transition-all duration-150 inline-block ${theme.text} ${theme.bg} ${theme.border} ${theme.hover}`;
        } else {
          span.className = "word-span text-slate-900 dark:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-all duration-150 inline-block";
        }

        span.onclick = () => handleWordClick(word);
        sentenceBlock.appendChild(span);
      }
    });

    const periodSpan = document.createElement('span');
    periodSpan.textContent = " .";
    periodSpan.className = "text-brand-600/30 dark:text-brand-400/30 font-bold select-none pr-1";
    sentenceBlock.appendChild(periodSpan);

    canvas.appendChild(sentenceBlock);
  });

  switchView('reader');
}

/**
 * Mengatur ukuran font pada reader canvas secara interaktif
 * @param {number} dir - Arah perubahan (-1 untuk perkecil, 1 untuk perbesar)
 */
function adjustReaderFont(dir) {
  // 1. Update Ukuran Font (Kelipatan 3px)
  appState.readerFontSize = Math.max(18, Math.min(72, appState.readerFontSize + (dir * 3)));
  
  // 2. Update Spasi Baris Secara Proporsional (Kenaikan 0.1 multiplier)
  appState.readerLineHeight = Number((Math.max(1, Math.min(7, parseFloat(appState.readerLineHeight) + (dir * 0.1)))).toFixed(1));
  
  // Simpan ke localStorage
  localStorage.setItem('meb_reader_font_size', appState.readerFontSize);
  localStorage.setItem('meb_reader_line_height', appState.readerLineHeight);

  // 3. Sinkronkan Slider UI di Header
  const slider = document.getElementById('line-height-slider');
  if (slider) slider.value = appState.readerLineHeight;
  const sliderV = document.getElementById('line-height-slider-v');
  if (sliderV) sliderV.value = appState.readerLineHeight;

  const canvas = document.getElementById('reader-canvas');
  if (canvas) {
    canvas.style.fontSize = `${appState.readerFontSize}px`;
    // Terapkan perubahan spasi ke seluruh blok teks yang sudah ada
    const blocks = document.querySelectorAll('.sentence-block');
    blocks.forEach(block => block.style.lineHeight = appState.readerLineHeight);
  }
}

/**
 * Mengatur ketinggian baris (line-height) secara interaktif via slider
 * @param {number} val - Nilai multiplier spasi baris
 */
function adjustReaderLineHeight(val) {
  appState.readerLineHeight = Number(val);
  localStorage.setItem('meb_reader_line_height', val);

  // Sinkronkan kedua slider
  const hSlider = document.getElementById('line-height-slider');
  const vSlider = document.getElementById('line-height-slider-v');
  if (hSlider) hSlider.value = val;
  if (vSlider) vSlider.value = val;

  const blocks = document.querySelectorAll('.sentence-block');
  blocks.forEach(block => {
    block.style.lineHeight = val;
  });
}

/**
 * Mengembalikan pengaturan font dan spasi ke nilai standar
 */
function resetReaderSettings() {
  appState.readerFontSize = 36;
  appState.readerLineHeight = 3.2;
  localStorage.setItem('meb_reader_font_size', 36);
  localStorage.setItem('meb_reader_line_height', 3.2);

  const slider = document.getElementById('line-height-slider');
  if (slider) slider.value = 3.2;
  const sliderV = document.getElementById('line-height-slider-v');
  if (sliderV) sliderV.value = 3.2;

  const canvas = document.getElementById('reader-canvas');
  if (canvas) {
    canvas.style.fontSize = `36px`;
    const blocks = document.querySelectorAll('.sentence-block');
    blocks.forEach(block => block.style.lineHeight = 3.2);
  }
  showModal("Pengaturan Direset", "Ukuran font dan spasi baris dikembalikan ke standar.", "fa-solid fa-rotate-left text-brand-600");
}

/**
 * Menutup dialog modal sistem kustom
 */
function closeModal() {
  document.getElementById('custom-modal').classList.add('hidden');
}

/**
 * Membuat visualisasi blok struktur imbuhan/dasar (Mode B) di modal kamus
 */
function buildDynamicModeBLayout(mapping, cleanWordWithHarakat) {
  const container = document.getElementById('dynamic-modeb-container');
  container.innerHTML = ''; 

  const prefixes = [mapping.Sambungan_Awal_1, mapping.Sambungan_Awal_2, mapping.Sambungan_Awal_3].filter(Boolean);
  const suffixes = [mapping.Sambungan_Akhir_1, mapping.Sambungan_Akhir_2, mapping.Sambungan_Akhir_3].filter(Boolean);

  const parentWord = appState.kataInduk.find(ki => ki.ID_Kata_Induk === mapping.ID_Kata_Induk);
  const rootText = parentWord ? parentWord.Kata_Induk : cleanWordWithHarakat;
  const rootMeaning = parentWord ? parentWord.Arti_Kata_Induk : (mapping.Arti_Kata_Teks || "Kata dasar");

  function createAffixBlock(affixId) {
    const meta = appState.sambungan.find(s => s.ID_Sambungan === affixId);
    if (!meta) return null;

    const jenis = meta.Jenis_Sambungan || "Imbuhan";
    const bentuk = meta.Bentuk_Sambungan || "";
    const fungsi = meta.Fungsi_Sambungan || "";

    const block = document.createElement('div');
    block.className = "flex flex-col items-center bg-indigo-50/70 dark:bg-indigo-950/25 p-3 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/30 text-center min-w-[90px] flex-1 max-w-[140px]";
    
    block.innerHTML = `
      <span class="text-[8px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">${jenis}</span>
      <span class="text-2xl font-bold font-arabic text-indigo-700 dark:text-indigo-400">${bentuk}</span>
      <span class="text-xs font-bold text-slate-700 dark:text-slate-300 mt-2">${fungsi}</span>
    `;
    return block;
  }

  function createRootBlock() {
    const block = document.createElement('div');
    block.className = "flex flex-col items-center bg-teal-50 dark:bg-teal-950/20 p-3 rounded-2xl border border-teal-100/60 dark:border-teal-900/40 text-center min-w-[110px] flex-[1.5] max-w-[180px]";
    block.innerHTML = `
      <span class="text-[8px] text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider mb-1">Akar Kata (Root)</span>
      <span class="text-2xl font-bold font-arabic text-teal-800 dark:text-teal-300">${rootText}</span>
      <span class="text-xs font-bold text-slate-800 dark:text-slate-100 mt-2">${rootMeaning}</span>
    `;
    return block;
  }

  // Prefiks (Kanan)
  prefixes.forEach(pId => {
    const block = createAffixBlock(pId);
    if (block) container.appendChild(block);
  });

  // Akar (Tengah)
  container.appendChild(createRootBlock());

  // Sufiks (Kiri)
  suffixes.forEach(sId => {
    const block = createAffixBlock(sId);
    if (block) container.appendChild(block);
  });
}

/**
 * Mengaktifkan/menyembunyikan terjemahan lengkap di reader
 */
function toggleTranslation() {
  const transDiv = document.getElementById('reader-translation');
  const label = document.getElementById('toggle-trans-label');
  if (transDiv.classList.contains('hidden')) {
    transDiv.classList.remove('hidden');
    label.textContent = "Sembunyikan Terjemahan Indonesia";
  } else {
    transDiv.classList.add('hidden');
    label.textContent = "Tampilkan Terjemahan Indonesia";
  }
}

/**
 * Me-render daftar kosakata personal user pada Leitner box table
 * @param {string} boxFilter - Filter nomor box ('semua', '1', '2', '3', '4', '5', 'Known')
 */
function renderKamusTable(boxFilter = 'semua') {
  const tbody = document.getElementById('kamus-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  appState.selectedBoxFilter = boxFilter;
  let list = appState.kamusUser || [];

  if (boxFilter !== 'semua') {
    list = list.filter(item => item.Status_Belajar && item.Status_Belajar.toString() === boxFilter.toString());
  }

  document.getElementById('kamus-badge-count').textContent = `${list.length} Kosakata`;
  document.getElementById('kamus-list-title').textContent = boxFilter === 'semua' ? "Semua Kosakata Kamus" : `Kosakata di Box ${boxFilter}`;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-12 text-slate-400 dark:text-slate-500">
          <i class="fa-solid fa-graduation-cap text-3xl mb-2 opacity-50 block"></i>
          Belum ada kosakata untuk kriteria Box ini.
        </td>
      </tr>`;
    return;
  }

  list.forEach(item => {
    const row = document.createElement('tr');
    row.className = "hover:bg-slate-50 dark:hover:bg-slate-800/40 transition text-slate-700 dark:text-slate-300";
    
    let boxTagColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    if (item.Status_Belajar.toString() === "Known") {
      boxTagColor = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
    } else if (item.Status_Belajar == 1) {
      boxTagColor = "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400";
    } else if (item.Status_Belajar == 2) {
      boxTagColor = "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
    } else if (item.Status_Belajar == 3) {
      boxTagColor = "bg-yellow-50 text-yellow-650 dark:bg-yellow-950/40 dark:text-yellow-400";
    } else if (item.Status_Belajar == 4) {
      boxTagColor = "bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400";
    } else if (item.Status_Belajar == 5) {
      boxTagColor = "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400";
    }

    const vocalizedWord = getVocalizedWord(item);

    row.innerHTML = `
      <td class="px-6 py-4 font-bold font-arabic text-right text-lg text-slate-900 dark:text-white" dir="rtl">${vocalizedWord}</td>
      <td class="px-6 py-4 font-medium">${item.Arti_Kustom}</td>
      <td class="px-6 py-4"><span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${boxTagColor}">Box ${item.Status_Belajar}</span></td>
      <td class="px-6 py-4 text-slate-455">${new Date(item.Tanggal_Review_Berikutnya).toLocaleDateString('id-ID')}</td>
      <td class="px-6 py-4 font-bold text-teal-600">${item.Streak_Benar || 0} <i class="fa-solid fa-fire text-[10px]"></i></td>
      <td class="px-6 py-4 text-center">
        <button onclick="deleteKamusWord('${item.ID_User_Word}')" class="text-slate-400 hover:text-rose-600 p-1.5 rounded transition">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </td>`;
    tbody.appendChild(row);
  });
}

/**
 * Filter tabel kamus berdasarkan nomor Box
 */
function filterKamusByBox(boxNo) {
  renderKamusTable(boxNo);
}

/**
 * Memuat kartu flashcard Leitner yang aktif saat sesi ujian
 */
function loadLeitnerCard() {
  const word = appState.leitnerSessionWords[appState.leitnerSessionIndex];
  const countText = `${appState.leitnerSessionIndex + 1} / ${appState.leitnerSessionWords.length}`;
  
  document.getElementById('leitner-progress-text').textContent = countText;
  document.getElementById('leitner-card-box-label').textContent = `KOTAK ${word.Status_Belajar}`;
  document.getElementById('leitner-word-arabic').textContent = getVocalizedWord(word);
  
  document.getElementById('leitner-meaning-box').classList.add('hidden');
  document.getElementById('btn-reveal-leitner').classList.remove('hidden');
  document.getElementById('leitner-actions').classList.add('hidden');
}

/**
 * Menampilkan jawaban arti dari kartu Leitner
 */
function revealLeitnerCard() {
  const word = appState.leitnerSessionWords[appState.leitnerSessionIndex];
  // Mengambil arti dari Kata Induk
  const parentWord = appState.kataInduk.find(ki => ki.ID_Kata_Induk === word.ID_Kata_Induk);
  const originalMeaning = parentWord ? parentWord.Arti_Kata_Induk : "Belum ada arti induk";

  document.getElementById('leitner-word-meaning').textContent = originalMeaning;
  
  const customEl = document.getElementById('leitner-word-custom');
  // Tampilkan hanya jika ada input kustom dari user (tidak kosong) dan bukan merupakan duplikasi dari arti induk
  if (word.Arti_Kustom && word.Arti_Kustom.trim() !== "" && word.Arti_Kustom !== originalMeaning) {
    customEl.classList.remove('hidden');
    customEl.textContent = `Arti Kustom: ${word.Arti_Kustom}`;
  } else {
    customEl.classList.add('hidden');
  }

  document.getElementById('leitner-meaning-box').classList.remove('hidden');
  document.getElementById('btn-reveal-leitner').classList.add('hidden');
  document.getElementById('leitner-actions').classList.remove('hidden');
}

/**
 * Menutup modal sesi latihan Leitner
 */
function closeLeitnerSession() {
  document.getElementById('leitner-modal').classList.add('hidden');
}

/**
 * Menutup modal jendela kamus pintar
 */
function closeDictModal() {
  document.getElementById('dict-modal').classList.add('hidden');
}

/**
 * Memperbarui data statistik Dashboard secara berkala
 */
function updateDashboardStats() {
  if (!appState.currentUser) return;

  const finishCount = appState.currentUser.stats ? appState.currentUser.stats.teksDibaca || 0 : 0;
  document.getElementById('stat-books').textContent = `${finishCount} Teks`;
  
  const vocabCount = appState.kamusUser ? appState.kamusUser.length : 0;
  document.getElementById('stat-vocab').textContent = `${vocabCount} Kata`;

  document.getElementById('sidebar-vocab-count').textContent = vocabCount;

  const sidebarLvl = document.getElementById('sidebar-level');
  if (vocabCount < 5) {
    sidebarLvl.textContent = "Level: Pre-A1";
    sidebarLvl.className = "text-[9px] font-extrabold text-pink-700 dark:text-pink-400 uppercase tracking-wide";
  } else if (vocabCount < 15) {
    sidebarLvl.textContent = "Level: A1";
    sidebarLvl.className = "text-[9px] font-extrabold text-brand-700 dark:text-brand-400 uppercase tracking-wide";
  } else {
    sidebarLvl.textContent = "Level: A2";
    sidebarLvl.className = "text-[9px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide";
  }

  if (appState.kamusUser) {
    document.getElementById('count-box-1').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 1).length;
    document.getElementById('count-box-2').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 2).length;
    document.getElementById('count-box-3').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 3).length;
    document.getElementById('count-box-4').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 4).length;
    document.getElementById('count-box-5').textContent = appState.kamusUser.filter(k => k.Status_Belajar == 5).length;
    document.getElementById('count-box-known').textContent = appState.kamusUser.filter(k => k.Status_Belajar && k.Status_Belajar.toString() === "Known").length;
  }
}

/**
 * Menampilkan custom alert modal box
 */
function showModal(title, message, iconClass = "fa-solid fa-circle-check text-emerald-500") {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  document.getElementById('modal-body').querySelector('i').className = `${iconClass} text-4xl mb-3`;
  document.getElementById('custom-modal').classList.remove('hidden');
}

/**
 * Mengubah tombol menjadi indikator loading
 */
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

/**
 * Melakukan toggle / pergantian mode gelap dan terang
 */
function toggleDarkMode() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('dark_mode', isDark);
  const iconClass = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  
  const sidebarIcon = document.getElementById('theme-icon-sidebar');
  const mobileIcon = document.getElementById('theme-icon-mobile');
  if (sidebarIcon) sidebarIcon.className = iconClass;
  if (mobileIcon) mobileIcon.className = iconClass;
}
