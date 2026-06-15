# Laporan Evaluasi Arsitektur & Keterhubungan Fungsi
## Proyek: Membaca Ekstensif Arab Bertingkat (MEB)

Laporan ini mengevaluasi struktur kode proyek, hubungan antar-fungsi, konsistensi penamaan, serta peluang refaktorisasi untuk meningkatkan efisiensi dan pemeliharaan kode (maintainability).

---

## 1. Temuan Utama: Celah Keterputusan Relasi & Koneksi Fungsi

### 🔴 A. Bug Pengalihan Sesi Admin (`auth.js`)
* **Masalah**: Pada file [admin/js/auth.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/auth.js#L59), fungsi `checkAdminSession` melakukan pengalihan ke dashboard dengan kode berikut:
  ```javascript
  window.location.href = "index.html";
  ```
  Namun, di dalam folder `admin/`, **tidak ada file bernama `index.html`**. File dashboard admin yang sebenarnya adalah [admin-index.html](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/admin-index.html).
* **Dampak**: Jika admin yang sudah login kembali membuka halaman login, atau jika sesi aktif diverifikasi, sistem akan mengalihkan pengguna ke halaman kosong/tidak ada (Error 404).
* **Solusi**: Ubah target pengalihan menjadi `"admin-index.html"`.

### 🔴 B. Gagal CORS & Polling Paksa pada API Admin (`api.js`)
* **Masalah**: Fungsi `postDataToBackend` di [admin/js/api.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/api.js#L30) menggunakan parameter fetch `mode: "no-cors"`. Mode ini menghasilkan *opaque response* (JavaScript tidak dapat membaca isi respons dari server).
* **Dampak**: 
  1. Admin tidak bisa mengetahui apakah penyimpanan di Google Sheets benar-benar berhasil atau gagal dari status HTTP.
  2. Admin tidak bisa mendapatkan kembalian data penting (seperti ID unik yang dibuat oleh server).
  3. Terjadi **workaround tidak efisien**: Pengembang menambahkan delay buatan (`setTimeout` 1.5 detik) diikuti dengan penarikan ulang seluruh database (`syncDatabaseLive`).
* **Solusi**: Ubah mode request menjadi `cors` dan gunakan header `Content-Type: text/plain` (seperti yang digunakan di `latihan.html` dan `index.html` sisi user) guna menghindari isu preflight CORS pada Google Apps Script, sehingga status sukses dan data kembalian dapat dibaca langsung.

### 🔴 C. Ketimpangan Normalisasi Arab (Penyebab Relasi Kosakata Rusak)
* **Masalah**: 
  * Di sisi **User** ([index.html](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/index.html#L1371)), relasi kata dicari menggunakan `normalizeArabic` yang menstandardisasi karakter Alif (`أ`, `إ`, `آ` menjadi `ا`) dan menghapus Tatweel (`ـ`).
  * Di sisi **Admin** ([admin/js/ui.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/ui.js#L54)), pencarian database kosakata untuk visualisasi teks editor hanya menggunakan `cleanArabicDiacritics` yang menghapus harakat, tetapi **tidak menstandardisasi Alif atau Tatweel**.
* **Dampak**: Jika Admin memasukkan pemetaan kata menggunakan Alif Hamzah (misal: `أَسَدٌ`) dan User membacanya di teks dengan bentuk Alif polos (`اسد`), visualisasi atau pemetaan kamus bisa tidak terdeteksi (keterputusan relasi data).
* **Solusi**: Sentralisasi fungsi `normalizeArabic` ke file bersama [shared/arabic_utils.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/shared/arabic_utils.js) dan wajibkan kedua modul (Admin & User) menggunakan fungsi normalisasi yang sama saat membandingkan atau memetakan string Arab.

---

## 2. Redundansi Kode & Ketidakselarasan Nama

### 🟡 A. Duplikasi Logika antara Halaman Dashboard Admin & Latihan
Terdapat duplikasi kode sebesar **~80%** untuk fungsi pemetaan kosakata antara [admin/js/ui.js](file:///d:/OneDrive%20-%20Education%2520Technology%2520Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/ui.js) / [admin/js/app.js](file:///d:/OneDrive%2520-%2520Education%2520Technology%2520Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/app.js) dengan skrip inline di [admin/latihan.html](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/latihan.html).

Berikut adalah daftar fungsi yang menduplikat logika satu sama lain:

| Fungsi di Halaman Latihan (`latihan.html`) | Fungsi Setara di Modul Admin (`ui.js` / `app.js`) | Status |
| :--- | :--- | :--- |
| `openVocabPopupForWord(raw, clean)` | `openVocabPopupForWord(raw, clean)` | Duplikat Persis |
| `closeVocabModal()` | `closeVocabModal()` | Duplikat Persis |
| `toggleJenisKataForm()` | `toggleJenisKataForm()` | Duplikat Persis |
| `showKataIndukAutocomplete(val)` | `showKataIndukAutocomplete(val)` | Duplikat Persis |
| `addSambunganRow(...)` | `addSambunganRow(...)` | Duplikat Persis |
| `showSambunganAutocomplete(inputEl)` | `showSambunganAutocomplete(inputEl)` | Duplikat Persis |
| `fillSambunganFungsi(...)` | `fillSambunganFungsi(...)` | Duplikat Persis |
| `handleSaveVocabMapping(event)` | `handleSaveVocabMapping(event)` | Duplikat (>90% logika sama) |
| `showToast(message, type)` | `showToast(message, type)` | Duplikat Persis |

### 🟡 B. Skrip Raksasa Monolitik (Inline Script Bloat)
* Halaman **User** ([index.html](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/index.html)) memiliki **~1380 baris** skrip JavaScript inline.
* Halaman **Latihan Admin** ([admin/latihan.html](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/latihan.html)) memiliki **~1050 baris** skrip JavaScript inline.
* Di sisi lain, file-file modular berformat `.js` yang sudah disiapkan seperti:
  * [js/user_api.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/js/user_api.js) (0 bytes)
  * [js/user_app.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/js/user_app.js) (0 bytes)
  * [js/user_ui.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/js/user_ui.js) (0 bytes)
  * [css/user_style.css](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/css/user_style.css) (0 bytes)
  * [admin/css/admin_styles.css](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/css/admin_styles.css) (0 bytes)
  
  **Semuanya dibiarkan kosong.** Hal ini bertentangan dengan prinsip *Separation of Concerns* (SoC) dan menyulitkan pemeliharaan kode jangka panjang.

### 🟡 C. Ketidakselarasan Nama Fungsi API & Komunikasi
* Sisi **User Reader**: menggunakan `apiCall(payload)` untuk POST.
* Sisi **Admin Dashboard**: menggunakan `postDataToBackend(action, payload)` untuk POST dan `syncDatabaseLive()` untuk GET.
* Sisi **Admin Latihan**: menggunakan `apiCall(payload)` untuk POST dan `refreshLatihanMetadata()` untuk GET.

---

## 3. Rencana Refaktorisasi & Pemindahan Fungsi

Untuk merapikan proyek dan meningkatkan efisiensi kerja, berikut adalah rekomendasi langkah refaktor terstruktur:

### 🟩 Tahap 1: Restrukturisasi Utilitas Bersama (`shared/arabic_utils.js`)
Pindahkan dan satukan seluruh fungsi pembersihan & manipulasi string Arab ke dalam [shared/arabic_utils.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/shared/arabic_utils.js):
1. **`cleanArabicDiacritics(word)`**: Membersihkan tanda harakat umum tetapi **tetap mempertahankan Syaddah (`ّ`)** untuk kebutuhan visualisasi imbuhan.
2. **`cleanArabicHarakat(text)`**: Membersihkan seluruh harakat termasuk Syaddah.
3. **`normalizeArabic(text)`**: Menormalisasi jenis Alif dan menghapus Tatweel untuk pencarian database yang presisi.

### 🟩 Tahap 2: Modularisasi Kode Halaman User
Pecah inline script di [index.html](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/index.html) (1380+ baris) ke dalam file aset eksternal:
* **[js/user_api.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/js/user_api.js)**: 
  * `apiCall()`
  * `pullSystemDataFromServer()`
  * `pullUserKamusFromServer()`
* **[js/user_ui.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/js/user_ui.js)**:
  * `switchView()`, `setupUserInterface()`, `updateDashboardStats()`
  * `renderLibrary()`, `searchLibrary()`
  * `loadReader()`, `adjustReaderFont()`, `adjustReaderLineHeight()`, `resetReaderSettings()`
  * `renderKamusTable()`
  * `loadLeitnerCard()`, `revealLeitnerCard()`
  * `showModal()`, `showSpinnerButton()`, `toggleDarkMode()`
* **[js/user_app.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/js/user_app.js)**:
  * Inisialisasi state utama `appState`.
  * `window.onload`
  * `handleAuthSubmit()`, `bypassLogin()`, `logout()`, `handleAvatarClick()`
  * `loadMockData()`
  * `handleWordClick()`, `saveWordToPersonalKamus()`, `markReadAsFinished()`
  * `submitLeitnerResult()`, `nextLeitnerCard()`, `closeLeitnerSession()`

### 🟩 Tahap 3: Penyelarasan API Admin & Opaque CORS Fix
1. Ubah `postDataToBackend` di [admin/js/api.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/api.js) untuk memakai mode `cors` dan header `text/plain`. 
2. Buat fungsi `postDataToBackend` mengembalikan objek JSON dari database sehingga form admin bisa langsung mendapatkan ID induk yang baru tanpa jeda delay 1.5 detik.

### 🟩 Tahap 4: Modularisasi Kode Halaman Latihan Admin
Logika pemetaan kata di `latihan.html` yang menduplikat `ui.js` dan `app.js` harus dihapus dari inline script dan disatukan. Karena `admin-index.html` dan `latihan.html` memakai modal pemetaan kosakata yang identik:
* Jadikan fungsi popup pemetaan di [admin/js/ui.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/ui.js) dan [admin/js/app.js](file:///d:/OneDrive%20-%20Education%20Technology%20Indonesia/Dokumen/GitHub/membaca_ekstensif_arab/admin/js/app.js) reusable (dapat digunakan bersama).
* Muat `js/ui.js` dan `js/app.js` di dalam `latihan.html` daripada menulis ulang fungsi visualisasinya.
