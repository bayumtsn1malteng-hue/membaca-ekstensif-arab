# Rencana Kerja Migrasi Storage: LocalStorage ke IndexedDB (Dexie.js)
**Versi Dokumen:** v1.4.1
**Target:** Optimalisasi PWA, Latihan Terpadu, dan Sinkronisasi Cloud.

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

## 3. Tahapan Implementasi Terkisa
### Fase 4: Pengayaan Fitur Latihan & Leitner (v0.9.0+)
- [ ] **Stabilisasi Integrasi Modular (v0.9.1-hotfix):** 
    - Memperbaiki `SyntaxError` pada `user_app.js`: Validasi lokasi dan export `pullSystemDataFromServer` (pastikan berada di `user_api.js` atau `user_events.js` dan diekspor dengan benar).
    - Memperbaiki `ReferenceError: switchView`: Memastikan fungsi navigasi di `user_ui.js` telah didaftarkan ke objek `window` melalui `user_app.js` agar dapat diakses oleh inline event HTML.
- [ ] **Visualisasi & Persistensi:** Menambahkan Pie Chart hasil latihan dan fitur resume sesi (v0.9.2).
- [ ] **Bookmark Soal & Review Mode:** Implementasi fitur bookmark soal dan mode review khusus di `latihan.html` serta daftar di `index.html` (v0.9.3).

## 4. Keamanan & Integritas Data
... (tetap)

## 5. Aturan Versi
- Selalu naikkan versi alpha setiap kali ada perubahan minor/patch
- Setiap perubahan pada modul JS/HTML wajib menaikkan minor/patch version.
- selalu naikkan versi sw.js setiap kali ada perubahan.

## 6. Aturan Pengembangan
- Prioritas: Android kelas menengah ke bawah (Low-latency, Touch-friendly).
- Skalabilitas: Responsif hingga Desktop.
- Tipografi: Noto Sans Arabic sebagai standar keterbacaan.
- Gunakan `bulkPut` untuk mencegah duplikasi data saat sinkronisasi berulang.
- Tetap simpan `meb_user` (metadata sesi) di localStorage karena ukurannya kecil dan sering diakses secara synchronous saat boot.
- Prioritaskan pengguna Android kelas menengah ke bawah.

