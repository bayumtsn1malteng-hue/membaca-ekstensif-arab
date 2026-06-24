// State pelacak timer kustom
import { renderInteractiveArabicText, showSpinnerButton } from "./user_ui.js";
import { appState } from "./user_state.js";
import { toggleBookmark, renderBookmarkedQuestionsList } from "./user_ui.js";
import { apiCall } from "./user_api.js";

let challengeTimerInterval = null;
let challengeTimerType = 'total'; // 'total' atau 'per-question'
let challengeTimeRemaining = 0;
let challengeQuestionTimeLimit = 0; // dalam detik

// State pelacak transisi mode
let isModeChanging = false;

// BACKUP MASTER SOAL: Menyimpan daftar seluruh soal asli agar aman dari manipulasi mode bookmark
let originalQuestionsBackup = null;
let lastBackedUpSetId = null;

/**
 * Menginialisasi soal latihan awal dan mencadangkannya
 */

export function initExerciseQuestions(questions) {
  originalQuestionsBackup = [...questions];
  appState.exerciseQuestions = [...questions];
  if (appState) {
    lastBackedUpSetId = appState.currentExerciseSetId;
  }
}

/**
 * Membersihkan cadangan soal asli ketika berganti atau keluar dari set latihan
 */
export function clearOriginalQuestionsBackup() {
  originalQuestionsBackup = null;
  lastBackedUpSetId = null;
}

/**
 * Mengambil backup soal asli dari appState jika belum di-backup
 */
function backupOriginalQuestions() {
  if (appState && appState.currentExerciseSetId !== lastBackedUpSetId) {
    originalQuestionsBackup = null;
    lastBackedUpSetId = appState.currentExerciseSetId;
  }

  if (!originalQuestionsBackup && appState && appState.exerciseQuestions && appState.exerciseQuestions.length > 0) {
    // Hanya backup jika mode saat ini bukan bookmark_review agar tidak mem-backup soal yang sudah tersaring
    if (appState.exerciseMode !== 'bookmark_review') {
      originalQuestionsBackup = [...appState.exerciseQuestions];
    }
  }
}



/**
 * Menghentikan jalannya timer tantangan dan menyembunyikan display visualnya
 */
export function stopChallengeTimer() {
  if (challengeTimerInterval) {
    clearInterval(challengeTimerInterval);
    challengeTimerInterval = null;
  }
  const display = document.getElementById('challenge-timer-display');
  if (display) display.classList.add('hidden');
}

/**
 * Menampilkan pesan toast kustom menggunakan Tailwind CSS
 */
function showToast(message, icon = "fa-solid fa-clock text-brand-500") {
  const toastContainer = document.getElementById('toast-container') || (() => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = "fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none";
    document.body.appendChild(container);
    return container;
  })();

  const toast = document.createElement('div');
  toast.className = "flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 text-sm font-medium animate-[slideUp_0.3s_ease-out_1] pointer-events-auto max-w-sm transition-all duration-300";
  toast.innerHTML = `
    <div class="flex-shrink-0"><i class="${icon}"></i></div>
    <div class="flex-grow">${message}</div>
    <button class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition ml-2" onclick="this.parentElement.remove()">
      <i class="fa-solid fa-xmark text-xs"></i>
    </button>
  `;

  toastContainer.appendChild(toast);

  // Otomatis hapus setelah 4 detik
  setTimeout(() => {
    toast.classList.add('opacity-0', 'scale-95');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Memperbarui tampilan countdown pada elemen UI 'challenge-timer-display'
 */
function updateTimerDisplay(seconds) {
  const display = document.getElementById('challenge-timer-display');
  if (!display) return;

  const minutesStr = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secondsStr = String(seconds % 60).padStart(2, '0');

  display.textContent = `${minutesStr}:${secondsStr}`;
  display.classList.remove('hidden');

  // Beri warna merah jika waktu kurang dari 10 detik atau 15% waktu tersisa
  if (seconds <= 10) {
    display.className = "px-3 py-1.5 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 animate-pulse";
  } else {
    display.className = "px-3 py-1.5 rounded-full text-xs font-bold bg-brand-50 text-brand-600 border border-brand-100 dark:bg-slate-800 dark:text-brand-400 dark:border-slate-700";
  }
}

/**
 * Memulai timer tantangan (bisa mode total maupun per soal)
 */
export function startChallengeTimer(totalSeconds, type) {
  stopChallengeTimer();
  challengeTimerType = type;

  if (type === 'total') {
    challengeTimeRemaining = totalSeconds;
    updateTimerDisplay(challengeTimeRemaining);

    challengeTimerInterval = setInterval(() => {
      challengeTimeRemaining--;
      if (challengeTimeRemaining <= 0) {
        challengeTimeRemaining = 0;
        updateTimerDisplay(0);
        stopChallengeTimer();
        showToast("Waktu tantangan telah habis! Mengirimkan hasil...", "fa-solid fa-hourglass-end text-rose-500");
        submitExerciseResults();
      } else {
        updateTimerDisplay(challengeTimeRemaining);
      }
    }, 1000);
  } else if (type === 'per-question') {
    const totalQuestions = appState.exerciseQuestions.length;
    challengeQuestionTimeLimit = Math.floor(totalSeconds / (totalQuestions || 1));

    // Set batas minimal waktu per soal adalah 5 detik
    if (challengeQuestionTimeLimit < 5) {
      challengeQuestionTimeLimit = 5;
    }

    startPerQuestionTimer();
  }
}

/**
 * Logika internal untuk mengelola countdown spesifik per soal
 */
function startPerQuestionTimer() {
  if (challengeTimerInterval) {
    clearInterval(challengeTimerInterval);
  }

  challengeTimeRemaining = challengeQuestionTimeLimit;
  updateTimerDisplay(challengeTimeRemaining);

  challengeTimerInterval = setInterval(() => {
    challengeTimeRemaining--;
    if (challengeTimeRemaining <= 0) {
      challengeTimeRemaining = 0;
      updateTimerDisplay(0);

      const isLastQuestion = appState.currentQuestionIndex === appState.exerciseQuestions.length - 1;
      if (isLastQuestion) {
        stopChallengeTimer();
        showToast("Waktu soal terakhir habis! Mengirimkan hasil...", "fa-solid fa-hourglass-end text-rose-500");
        submitExerciseResults();
      } else {
        showToast("Waktu soal habis! Berpindah otomatis.", "fa-solid fa-circle-right text-amber-500");
        nextQuestion();
      }
    } else {
      updateTimerDisplay(challengeTimeRemaining);
    }
  }, 1000);
}

/**
 * Membuat modal kustom dinamis untuk konfigurasi waktu tantangan
 */
function showChallengeSetupModal(onConfirm, onCancel) {
  // Hapus jika modal sebelumnya masih menempel
  const existingModal = document.getElementById('challenge-setup-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'challenge-setup-modal';
  modal.className = "fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out_1]";

  modal.innerHTML = `
    <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 transform transition-all duration-300 scale-95 opacity-0" id="setup-modal-card">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center text-brand-600">
            <i class="fa-solid fa-stopwatch text-lg"></i>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-850 dark:text-slate-100">Konfigurasi Tantangan</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Atur batasan waktu tantangan Anda</p>
          </div>
        </div>
        <button id="btn-close-setup" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>

      <!-- Langkah 1: Apakah Berbatas Waktu? -->
      <div id="step-timed" class="space-y-4">
        <p class="text-sm text-slate-600 dark:text-slate-300">Apakah Anda ingin menggunakan batasan waktu pengerjaan untuk tantangan ini?</p>
        <div class="grid grid-cols-2 gap-3 pt-2">
          <button id="btn-timed-no" class="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition">
            Tidak (Bebas)
          </button>
          <button id="btn-timed-yes" class="px-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition">
            Ya, Pakai Waktu
          </button>
        </div>
      </div>

      <!-- Langkah 2: Berapa Lama & Jenis Pembagian (Disembunyikan di awal) -->
      <div id="step-config" class="space-y-5 hidden">
        <div>
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">DURASI TOTAL (MENIT)</label>
          <div class="flex gap-2 items-center">
            <input type="number" id="input-duration" value="5" min="1" max="120" class="flex-grow p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold" />
            <span class="text-sm font-semibold text-slate-500 dark:text-slate-400">Menit</span>
          </div>
          <!-- Tombol Pilihan Instan -->
          <div class="flex gap-2 mt-2">
            <button class="btn-quick-time px-3 py-1.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold" data-val="3">3 Mnt</button>
            <button class="btn-quick-time px-3 py-1.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold" data-val="5">5 Mnt</button>
            <button class="btn-quick-time px-3 py-1.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold" data-val="10">10 Mnt</button>
            <button class="btn-quick-time px-3 py-1.5 rounded-lg text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold" data-val="15">15 Mnt</button>
          </div>
        </div>

        <div class="border-t border-slate-100 dark:border-slate-800 pt-4">
          <label class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">SISTEM PEMBAGIAN WAKTU</label>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Bagaimana sisa waktu tantangan didistribusikan ke soal?</p>
          
          <div class="space-y-2">
            <!-- Pilihan A: Total Bebas -->
            <label class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <input type="radio" name="timer-type" value="total" checked class="mt-1 text-brand-600 focus:ring-brand-500" />
              <div>
                <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Waktu Bebas Seluruh Soal</span>
                <span class="block text-[10px] text-slate-500 dark:text-slate-400">Total durasi bebas digunakan di nomor mana pun hingga nol.</span>
              </div>
            </label>

            <!-- Pilihan B: Per Soal -->
            <label class="flex items-start gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition">
              <input type="radio" name="timer-type" value="per-question" class="mt-1 text-brand-600 focus:ring-brand-500" />
              <div>
                <span class="block text-xs font-bold text-slate-800 dark:text-slate-200">Waktu Rata Per Soal</span>
                <span class="block text-[10px] text-slate-500 dark:text-slate-400">Waktu total dibagi rata. Kehabisan waktu memaksa pindah soal berikutnya.</span>
              </div>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <button id="btn-back-step" class="px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition">
            Kembali
          </button>
          <button id="btn-submit-config" class="px-4 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition">
            Mulai Tantangan
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Memicu transisi masuk yang mulus
  const card = modal.querySelector('#setup-modal-card');
  setTimeout(() => {
    card.classList.remove('scale-95', 'opacity-0');
    card.classList.add('scale-100', 'opacity-100');
  }, 50);

  // Event handler untuk navigasi langkah modal
  const stepTimed = modal.querySelector('#step-timed');
  const stepConfig = modal.querySelector('#step-config');
  const inputDuration = modal.querySelector('#input-duration');

  // Close/Cancel
  const closeModal = () => {
    card.classList.remove('scale-100', 'opacity-100');
    card.classList.add('scale-95', 'opacity-0');
    modal.classList.add('opacity-0');
    setTimeout(() => {
      modal.remove();
      onCancel();
    }, 200);
  };

  modal.querySelector('#btn-close-setup').onclick = closeModal;

  // Langkah 1: Tidak berbatas waktu
  modal.querySelector('#btn-timed-no').onclick = () => {
    modal.remove();
    onConfirm({ isTimed: false });
  };

  // Langkah 1: Ya, berbatas waktu (pindah ke langkah 2)
  modal.querySelector('#btn-timed-yes').onclick = () => {
    stepTimed.classList.add('hidden');
    stepConfig.classList.remove('hidden');
  };

  // Langkah 2: Kembali ke langkah 1
  modal.querySelector('#btn-back-step').onclick = () => {
    stepConfig.classList.add('hidden');
    stepTimed.classList.remove('hidden');
  };

  // Langkah 2: Tombol instan
  modal.querySelectorAll('.btn-quick-time').forEach(btn => {
    btn.onclick = () => {
      inputDuration.value = btn.getAttribute('data-val');
    };
  });

  // Kirim hasil konfigurasi
  modal.querySelector('#btn-submit-config').onclick = () => {
    const minutes = parseInt(inputDuration.value);
    const selectedType = modal.querySelector('input[name="timer-type"]:checked').value;

    if (isNaN(minutes) || minutes <= 0) {
      showToast("Durasi tidak valid. Masukkan minimal 1 menit.", "fa-solid fa-circle-exclamation text-rose-500");
      return;
    }

    modal.remove();
    onConfirm({
      isTimed: true,
      seconds: minutes * 60,
      type: selectedType
    });
  };
}

/**
 * Mengubah mode latihan aktif
 */


let lastDirection = 'next';
export function setExerciseMode(mode, keepAnswer = false) {

  // Menghentikan fungsi bila mode yang dipanggil sama
  if (mode === appState.exerciseMode) return;

  // Simpan mode saat ini sebagai mode sebelumnya sebelum diubah
  const previousMode = appState.exerciseMode;

  backupOriginalQuestions();

  appState.exerciseMode = mode;

  //Reset Soal
  appState.currentQuestionIndex = 0;


  // Tandai bahwa kita sedang berpindah mode untuk memicu animasi khusus
  isModeChanging = true;

  const modes = {
    read: document.getElementById('btn-mode-read'),
    practice: document.getElementById('btn-mode-practice'),
    challenge: document.getElementById('btn-mode-challenge'),
    bookmark_review: document.getElementById('btn-mode-bookmark-review')
  };

  Object.entries(modes).forEach(([key, btn]) => {
    if (!btn) return;
    btn.className = (key === mode)
      ? "px-3 py-2 rounded-lg text-[10px] font-bold bg-white dark:bg-slate-700 text-brand-600 shadow-sm transition"
      : "px-3 py-2 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition";
  });

  // Hentikan timer terlebih dahulu dari mode sebelumnya
  stopChallengeTimer();
  challengeTimerType = 'total';

  if (mode === 'challenge') {
    // 1. CEK KONDISI KHUSUS: Jika user berasal dari mode bookmark_review
    if (previousMode === 'bookmark_review') {
      const totalBookmarks = appState.exerciseQuestions ? appState.exerciseQuestions.length : 0;
      isModeChanging = false; // Reset flag agar aman

      // Tampilkan modal konfirmasi tantangan khusus soal bookmark
      showBookmarkChallengeConfirmModal(totalBookmarks, previousMode);
      return; // Hentikan eksekusi, alur dilanjutkan oleh modal konfirmasi
    }

    // 2. ALUR NORMAL: Jika dari mode practice atau mode lainnya

    if (!keepAnswer) {
      appState.userAnswers = new Array(appState.exerciseQuestions.length).fill(null);
    }
    showChallengeSetupModal(
      // Callback ketika dikonfirmasi
      (config) => {
        if (config.isTimed) {
          startChallengeTimer(config.seconds, config.type);
          showToast(`Tantangan dimulai! Batas waktu aktif.`, "fa-solid fa-hourglass-start text-emerald-500");
        } else {
          showToast(`Tantangan dimulai tanpa batas waktu pengerjaan.`);
        }
        renderQuestion();
      },
      // Callback ketika dibatalkan (Kembali ke mode asal secara aman)
      () => {
        setExerciseMode(previousMode);
      }
    );
  } else {
    if (mode === 'bookmark_review') {
      // 1. Ambil daftar "kartu indeks tipis" yang berisi ID soal yang Anda tandai
      const bookmarks = JSON.parse(localStorage.getItem('meb_bookmarks') || '[]');
      const bookmarkedIds = bookmarks.map(b => b.id); // Kita hanya ambil daftar ID-nya saja, contoh: ["soal-01", "soal-05"]

      // 2. Ambil "buku soal fisik" yang utuh (berisi teks soal, pilihan A, B, C, D lengkap)
      const fullQuestionsSource = originalQuestionsBackup ? [...originalQuestionsBackup] : [];

      // 3. Saring! Hanya ambil soal utuh yang ID-nya ada di daftar tanda buku kita
      const filtered = fullQuestionsSource.filter(q => bookmarkedIds.includes(q.ID_No_Soal));

      if (filtered.length === 0) {
        alert("Tidak ada soal bookmark untuk himpunan ini.");
        setExerciseMode(previousMode, keepAnswer);
        return;
      }

      appState.exerciseQuestions = filtered;
    } else {
      // Mode 'read' dan 'practice' (serta safety fallback)
      appState.exerciseQuestions = originalQuestionsBackup ? [...originalQuestionsBackup] : [...appState.exerciseQuestions];
    }

    if (!keepAnswer) {
      appState.userAnswers = new Array(appState.exerciseQuestions.length).fill(null);
    }
    renderQuestion();
  }

  isModeChanging = false;
}

// ==========================================
// FUNGSI HELPER: MODAL KONFIRMASI BOOKMARK
// ==========================================
function showBookmarkChallengeConfirmModal(count, previousMode) {
  const oldModal = document.getElementById('bookmark-confirm-modal');
  if (oldModal) oldModal.remove();

  const modalHtml = `
    <div id="bookmark-confirm-modal" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div class="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all scale-95 opacity-0 duration-200">
        <div class="text-center">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mb-4">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Tantangan Baru!</h3>
          <p class="text-sm text-gray-600 dark:text-slate-300 mb-6">
            Jumlah soal bookmark kamu saat ini ada <span class="font-bold text-brand-600 dark:text-brand-400">${count} soal</span>. 
            Tantang kemampuanmu di mode tantangan!
          </p>
        </div>
        <div class="flex flex-col sm:flex-row-reverse gap-2">
          <button id="btn-confirm-yes" class="w-full inline-flex justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition">
            Ya, Tantang Saya
          </button>
          <button id="btn-confirm-no" class="w-full inline-flex justify-center rounded-xl bg-gray-100 dark:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition">
            Tidak (Tantangan Biasa)
          </button>
        </div>
      </div>
    </div>
  `;

  // document.body.insertAdjacentHTML('beforeend', modalHtml);
  // 1. Ubah string HTML menjadi elemen DOM menggunakan template element
  const template = document.createElement('template');
  template.innerHTML = modalHtml.trim();
  const modalElement = template.content.firstChild;

  // Menjamin z-index tinggi secara inline sebelum dimasukkan ke DOM
  modalElement.style.zIndex = "9999";

  // 2. Masukkan ke body menggunakan appendChild agar bersaing adil dengan modal z-50
  document.body.appendChild(modalElement);

  // Animasi masuk modal halus
  setTimeout(() => {
    const content = document.querySelector('#bookmark-confirm-modal > div');
    if (content) content.classList.remove('scale-95', 'opacity-0');
  }, 10);

  const closeModal = () => {
    const modal = document.getElementById('bookmark-confirm-modal');
    if (modal) modal.remove();
  };

  // AKSI: "YA" (Tantangan menggunakan soal Bookmark)
  document.getElementById('btn-confirm-yes').addEventListener('click', () => {
    closeModal();
    // Buka pengaturan waktu kuis, daftar soal tetap menggunakan bookmark yang sedang aktif
    appState.userAnswers = new Array(appState.exerciseQuestions.length).fill(null);
    showChallengeSetupModal(
      (config) => {
        if (config.isTimed) startChallengeTimer(config.seconds, config.type);
        renderQuestion();
      },
      () => { setExerciseMode(previousMode); } // Jika di pengaturan waktu klik Batal, kembali ke bookmark_review
    );
  });

  // AKSI: "TIDAK" (Tantangan menggunakan Seluruh Bank Soal)
  document.getElementById('btn-confirm-no').addEventListener('click', () => {
    closeModal();
    // Kembalikan soal ke seluruh bank soal menggunakan backup aman internal
    appState.exerciseQuestions = originalQuestionsBackup ? [...originalQuestionsBackup] : [...appState.exerciseQuestions];
    appState.currentQuestionIndex = 0;
    appState.userAnswers = new Array(appState.exerciseQuestions.length).fill(null);


    // Buka pengaturan waktu kuis
    showChallengeSetupModal(
      (config) => {
        if (config.isTimed) startChallengeTimer(config.seconds, config.type);
        renderQuestion();
      },
      () => { setExerciseMode(previousMode); } // Jika di pengaturan waktu klik Batal, kembali ke bookmark_review
    );
  });
}


/**
 * Merender konten soal aktif ke layar
 */
export function renderQuestion() {
  if (!appState.exerciseQuestions || appState.exerciseQuestions.length === 0) return;
  const data = appState.exerciseQuestions[appState.currentQuestionIndex];
  appState.currentQuestionData = data;
  const userAnswer = appState.userAnswers[appState.currentQuestionIndex];

  document.getElementById('question-counter').textContent = `Soal ${appState.currentQuestionIndex + 1} dari ${appState.exerciseQuestions.length}`;
  document.getElementById('btn-prev-q').disabled = appState.currentQuestionIndex === 0;

  // Apply Transition Animation
  const card = document.getElementById('question-card');
  // Bersihkan kelas animasi sebelumnya
  card.classList.remove('animate-slide-right', 'animate-slide-left', 'animate-mode-blur');
  void card.offsetWidth; // Trigger reflow

  // Jika perpindahan disebabkan oleh ganti mode, gunakan animasi blur yang halus
  if (isModeChanging) {
    card.classList.add('animate-mode-blur');
  } else {
    // Jika perpindahan antar nomor soal, gunakan slide standar
    card.classList.add(lastDirection === 'next' ? 'animate-slide-right' : 'animate-slide-left');
  }

  // Hook Tambahan: Jika menggunakan mode per soal (5.a), reset timer ke batas per soal setiap render soal baru
  if (appState.exerciseMode === 'challenge' && challengeTimerType === 'per-question' && challengeTimerInterval) {
    startPerQuestionTimer();
  }

  updateBookmarkUI();

  const btnNext = document.getElementById('btn-next-q');
  const btnFinish = document.getElementById('btn-finish-exercise');
  const allAnswered = appState.userAnswers && appState.userAnswers.every(a => a !== null);
  const isLastQuestion = appState.currentQuestionIndex === appState.exerciseQuestions.length - 1;

  // Logika tampilan tombol Selesai vs Navigasi Berikutnya //
  if (isLastQuestion) {
    btnNext.classList.add('hidden');

    if (appState.exerciseMode === 'challenge') {
      btnFinish.classList.remove('hidden');
      // Mode Tantangan: Wajib jawab semua
      btnFinish.disabled = !allAnswered;
      btnFinish.classList.toggle('opacity-50', !allAnswered);
      btnFinish.classList.toggle('cursor-not-allowed', !allAnswered);
      btnFinish.classList.toggle('animate-pulse', allAnswered);
    } else if (appState.exerciseMode === 'practice' || appState.exerciseMode === 'bookmark_review') {
      btnFinish.classList.remove('hidden');
      // Mode Latihan/Review: Boleh selesai kapan saja di akhir
      btnFinish.disabled = false;
      btnFinish.classList.remove('opacity-50', 'cursor-not-allowed');
      btnFinish.classList.add('animate-pulse');
    } else {
      btnFinish.classList.add('hidden');
      btnNext.classList.remove('hidden');
      btnNext.disabled = true;
    }
  } else {
    btnNext.classList.remove('hidden');
    btnFinish.classList.add('hidden');
    btnNext.disabled = false;
  }

  // Update Progress Bar
  const answeredCount = appState.userAnswers.filter(a => a !== null).length;
  const totalQuestions = appState.exerciseQuestions.length;
  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressText = document.getElementById('progress-text');

  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  progressBarFill.style.width = `${progressPercentage}%`;
  progressText.textContent = `${answeredCount}/${totalQuestions} Dijawab`;

  const questionContainer = document.getElementById('exercise-question-text');
  if (appState.exerciseMode === 'read') {
    renderInteractiveArabicText(data.Teks_Soal, 'exercise-question-text');
  } else {
    questionContainer.innerHTML = `<div class="sentence-block pr-4 border-r-4 border-brand-500/10 text-right font-arabic" dir="rtl">${data.Teks_Soal}</div>`;
    questionContainer.style.fontSize = `${appState.readerFontSize}px`;
  }

  // Feedback Area
  const feedbackArea = document.getElementById('feedback-area');
  // Feedback hanya muncul di Mode Latihan (Practice) jika sudah dijawab
  if ((appState.exerciseMode === 'practice' || appState.exerciseMode === 'bookmark_review') && userAnswer) {
    feedbackArea.classList.remove('hidden');
    const isCorrect = userAnswer === data.Jawaban_Benar;
    feedbackArea.className = isCorrect
      ? "mt-6 p-5 rounded-2xl border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/30 animate-[fadeIn_0.3s_ease-out_1]"
      : "mt-6 p-5 rounded-2xl border border-rose-100 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 animate-[fadeIn_0.3s_ease-out_1]";

    document.getElementById('feedback-icon').className = isCorrect ? "fa-solid fa-circle-check text-emerald-600" : "fa-solid fa-circle-xmark text-rose-600";
    document.getElementById('feedback-title').textContent = isCorrect ? "Jawaban Anda Benar!" : "Jawaban Kurang Tepat";
    document.getElementById('feedback-title').className = isCorrect ? "text-sm font-bold text-emerald-800 dark:text-emerald-300" : "text-sm font-bold text-rose-800 dark:text-rose-300";
    document.getElementById('feedback-text').textContent = (isCorrect ? data.Feedback_Jawaban_Benar : data.Feedback_Jawaban_Salah);
  } else {
    feedbackArea.classList.add('hidden');
  }

  // Update Visibilitas Legenda Leitner (Hanya di Mode Baca)
  const legend = document.getElementById('leitner-legend');
  if (legend) {
    if (appState.exerciseMode === 'read') {
      legend.classList.remove('hidden');
      setTimeout(() => legend.classList.remove('opacity-0'), 10);
    } else {
      legend.classList.add('opacity-0');
      setTimeout(() => legend.classList.add('hidden'), 300);
    }
  }

  const optionsContainer = document.getElementById('exercise-options');
  optionsContainer.innerHTML = '';
  ['A', 'B', 'C', 'D', 'E'].forEach(char => {
    const optionText = data[`Pilihan_${char}`];
    if (!optionText) return;

    const btn = document.createElement('div');
    let btnClasses = "flex items-center gap-4 p-4 rounded-2xl border transition-all group ";

    const label = document.createElement('span');
    let labelClasses = "w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition shrink-0 ";

    // Styling berdasarkan apakah sudah dijawab
    if ((appState.exerciseMode === 'challenge' || appState.exerciseMode === 'practice' || appState.exerciseMode === 'bookmark_review') && userAnswer) {
      if (char === data.Jawaban_Benar) {
        btnClasses += "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
        labelClasses += "bg-emerald-600 text-white";
      } else if (char === userAnswer) {
        btnClasses += "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800";
        labelClasses += "bg-rose-600 text-white";
      } else {
        btnClasses += "border-slate-100 dark:border-slate-800 opacity-50 grayscale pointer-events-none";
        labelClasses += "bg-slate-100 dark:bg-slate-800 text-slate-400";
      }
    } else {
      btnClasses += "border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer";
      labelClasses += "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-brand-100 group-hover:text-brand-600";
    }

    btn.className = btnClasses;
    label.className = labelClasses;
    label.textContent = char;

    const content = document.createElement('div');
    content.className = "flex-grow text-right overflow-hidden";
    content.id = `option-container-${char}`;

    btn.appendChild(label);
    btn.appendChild(content);
    optionsContainer.appendChild(btn);

    if (appState.exerciseMode === 'read' || ((appState.exerciseMode === 'practice' || appState.exerciseMode === 'bookmark_review') && !userAnswer)) {
      renderInteractiveArabicText(optionText, content.id);
    } else {
      content.textContent = optionText;
      content.className += " font-arabic text-xl text-slate-800 dark:text-slate-200";
    }
    if (!userAnswer && appState.exerciseMode !== 'read') btn.onclick = () => handleAnswerSelection(char);
  });
}

/**
 * Menangani pemilihan opsi jawaban oleh user
 */
export function handleAnswerSelection(char) {
  if (appState.exerciseMode === 'read' || appState.userAnswers[appState.currentQuestionIndex]) return;

  appState.userAnswers[appState.currentQuestionIndex] = char;
  saveExerciseProgress();
  renderQuestion();
}

/**
 * Navigasi ke nomor soal berikutnya
 */
export function nextQuestion() {
  if (appState.currentQuestionIndex < appState.exerciseQuestions.length - 1) {
    lastDirection = 'next';
    appState.currentQuestionIndex++;
    renderQuestion();
    saveExerciseProgress();
  }
}

/**
 * Navigasi ke nomor soal sebelumnya
 */
export function previousQuestion() {
  if (appState.currentQuestionIndex > 0) {
    lastDirection = 'prev';
    appState.currentQuestionIndex--;
    renderQuestion();
    saveExerciseProgress();
  }
}

let resultChart = null;

/**
 * Menampilkan rangkuman visual hasil latihan (diagram lingkaran)
 */
function showVisualSummary(correct, total) {
  const wrong = total - correct;
  document.getElementById('summary-correct').textContent = correct;
  document.getElementById('summary-wrong').textContent = wrong;
  document.getElementById('summary-set-title').textContent = appState.exerciseQuestions[0].Judul_Himpunan_Latihan;

  const ctx = document.getElementById('resultPieChart').getContext('2d');

  if (resultChart) resultChart.destroy();

  resultChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Benar', 'Salah'],
      datasets: [{
        data: [correct, wrong],
        backgroundColor: ['#10b981', '#f43f5e'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        legend: { display: false }
      }
    }
  });

  document.getElementById('exercise-summary-modal').classList.remove('hidden');
}

/**
 * Mengirimkan hasil pengerjaan kuis ke server atau menyimpannya secara lokal (Mock)
 */
export async function submitExerciseResults() {
  if (!appState.currentUser) {
    showModal("Gagal Mengirim", "Silakan login terlebih dahulu untuk menyimpan hasil latihan.", "fa-solid fa-circle-exclamation text-amber-500");
    return;
  }

  const totalQuestions = appState.exerciseQuestions.length;
  const totalCorrect = appState.exerciseQuestions.reduce((acc, q, idx) => {
    return acc + (appState.userAnswers[idx] === q.Jawaban_Benar ? 1 : 0);
  }, 0);
  const scorePercentage = Math.round((totalCorrect / totalQuestions) * 100);

  if (appState.isMockMode) {
    stopChallengeTimer();
    const newResult = {
      setId: appState.currentExerciseSetId || 'MOCK-SET-001',
      Total_Correct: totalCorrect,
      Total_Questions: totalQuestions,
      Score_Percentage: scorePercentage,
      Tanggal_Mengerjakan: new Date().toISOString()
    };

    // Simpan permanen ke localStorage
    let localScores = JSON.parse(localStorage.getItem('meb_local_scores') || '[]');
    localScores.unshift(newResult);
    localStorage.setItem('meb_local_scores', JSON.stringify(localScores));

    clearExerciseProgress();
    showVisualSummary(totalCorrect, totalQuestions);
    return;
  }

  const payload = {
    action: 'saveExerciseResults',
    userId: appState.currentUser.userId,
    setId: appState.currentExerciseSetId || 'MOCK-SET-001',
    results: appState.exerciseQuestions.map((q, idx) => ({
      questionId: q.ID_No_Soal,
      userAnswer: appState.userAnswers[idx],
      isCorrect: appState.userAnswers[idx] === q.Jawaban_Benar
    }))
  };

  showSpinnerButton('btn-finish-exercise', true);
  try {
    const res = await apiCall(payload);
    stopChallengeTimer();
    if (res.success || res.status === "success") {
      clearExerciseProgress();
      showVisualSummary(totalCorrect, totalQuestions);
    } else {
      showModal("Gagal Menyimpan", res.error || "Terjadi kesalahan pada server.", "fa-solid fa-circle-xmark text-rose-500");
    }
  } catch (err) {
    showModal("Koneksi Bermasalah", "Gagal menghubungi server. Hasil disimpan secara lokal di sesi ini.", "fa-solid fa-wifi text-amber-500");
  } finally {
    showSpinnerButton('btn-finish-exercise', false, "Selesai & Kirim");
  }
}

/**
 * Mengaktifkan dukungan gesture geser (swipe) untuk berganti soal
 */
export function setupSwipeSupport() {
  let touchstartX = 0;
  let touchendX = 0;
  const swipeThreshold = 50;
  const questionCard = document.getElementById('question-card');
  if (!questionCard) return;

  questionCard.addEventListener('touchstart', e => { touchstartX = e.changedTouches[0].screenX; }, { passive: true });
  questionCard.addEventListener('touchend', e => {
    touchendX = e.changedTouches[0].screenX;
    if (touchendX < touchstartX - swipeThreshold) nextQuestion();
    if (touchendX > touchstartX + swipeThreshold) previousQuestion();
  }, { passive: true });
}

/**
    * Menyimpan kemajuan sesi ke LocalStorage untuk resume
    */
export function saveExerciseProgress() {
  if (!appState.currentExerciseSetId || appState.exerciseMode === 'read') return;
  const progress = {
    setId: appState.currentExerciseSetId,
    index: appState.currentQuestionIndex,
    answers: appState.userAnswers,
    mode: appState.exerciseMode,
    timestamp: Date.now()
  };
  localStorage.setItem('meb_exercise_resume', JSON.stringify(progress));
}

/**
 * Menghapus kemajuan setelah selesai
 */
export function clearExerciseProgress() {
  localStorage.removeItem('meb_exercise_resume');
}