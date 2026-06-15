# Rencana Kerja Migrasi Storage: LocalStorage ke IndexedDB (Dexie.js)
**Versi Dokumen:** v1.0.0
**Target:** Meningkatkan kapasitas penyimpanan dan performa aplikasi MEB Arab.

## 1. Tujuan Utama
- **Kapasitas:** Mengatasi batasan 5MB localStorage untuk menampung ribuan peta kosakata.
- **Performa:** Operasi database bersifat asynchronous (non-blocking UI).
- **Offline-First:** Aplikasi memuat data dari IndexedDB secara instan saat startup. Sinkronisasi dengan Google Sheets terjadi di latar belakang.

## 2. Struktur Database (Schema Dexie)
- `pustaka`: ID_Teks (PK), Judul, Konten, dsb.
- `petaKosakata`: ID_Kosakata (PK), ID_Teks, Kata_Teks_Polos, dsb.
- `kamusUser`: ID_User_Word (PK), ID_User, Kata_Polos, Status_Belajar, dsb.
- `kataInduk`: ID_Kata_Induk (PK), Kata_Induk, Arti.
- `sambungan`: ID_Sambungan (PK), Bentuk, Fungsi.

## 3. Tahapan Implementasi
### Fase 1: Inisialisasi & Migrasi (v0.7.0)
- [ ] Import Dexie.js via CDN di `index.html`.
- [ ] Inisialisasi DB di `user_app.js`.
- [ ] Buat fungsi `migrateFromLocalStorage()` untuk memindahkan data `meb_local_kamus` lama.

### Fase 2: Refaktorisasi API (v0.7.1)
- [ ] Update `pullSystemDataFromServer` untuk menyimpan hasil fetch ke IndexedDB menggunakan `bulkPut`.
- [ ] Update `pullUserKamusFromServer` untuk sinkronisasi ke IndexedDB.

### Fase 3: Integrasi State & UI (v0.7.2)
- [ ] Ubah `appState` agar melakukan hidrasi awal dari IndexedDB sebelum fetch ke server.
- [ ] Update fungsi simpan/hapus kata agar berinteraksi langsung dengan Dexie.

## 4. Keamanan & Integritas Data
- Gunakan `bulkPut` untuk mencegah duplikasi data saat sinkronisasi berulang.
- Tetap simpan `meb_user` (metadata sesi) di localStorage karena ukurannya kecil dan sering diakses secara synchronous saat boot.

## 5. Aturan Versi
- Setiap perubahan pada modul JS/HTML wajib menaikkan minor/patch version.
- Migrasi ini menandai lompatan ke versi `v0.7.x-alpha`.