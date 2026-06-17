/**
 * SISTEM AUTENTIKASI & PROTEKSI ROUTE ADMIN
 * Versi: v0.5.2-alpha.1 (Peningkatan Keandalan & Diagnosis)
 * ID Unik: MEB-AUTH-JS-002
 * * Modul ini menangani enkripsi password satu arah menggunakan Web Crypto API (SHA-256),
 * penyimpanan sesi aman di sessionStorage, dan proteksi perpindahan halaman (Route Guard).
 */

// Kunci penyimpanan sesi di browser (otomatis hancur saat tab ditutup)
const SESSION_KEY = "meb_admin_session_token";

// Bumbu pengaman (Salt) untuk mencegah serangan kamus (Dictionary Attack)
const PASSWORD_SALT = "maktabah_alqishash_salt_2026_";

/**
 * Hash password default asli: "admin123"
 * Cara mendapatkan hash ini:
 * SHA256 dari ("maktabah_alqishash_salt_2026_" + "admin123")
 * Hasilnya disimpan secara permanen di bawah ini.
 */
const PASSWORD_HASH = "a82a5c34f0b42880f6398c42beb65aea53383dd441ea0617cc0323dff2d7d656";

/**
 * Mengonversi password teks polos menjadi hash SHA-256 dengan tambahan Salt (Satu Arah)
 * @param {string} password - Password teks polos dari input user
 * @returns {Promise<string>} Nilai heksadesimal hash SHA-256
 */
async function hashPassword(password) {
  const saltedPassword = PASSWORD_SALT + password;
  const encoder = new TextEncoder();
  const data = encoder.encode(saltedPassword);
  
  // Menggunakan Web Crypto API bawaan browser modern
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  // [DIAGNOSIS LOG] Membantu melacak apa yang salah di konsol browser (F12)
  console.log("[Auth - Debug] Kata sandi diinput :", `"${password}"`);
  console.log("[Auth - Debug] String setelah Salt :", `"${saltedPassword}"`);
  console.log("[Auth - Debug] Hasil Hash Browser  :", hashHex);
 //  console.log("[Auth - Debug] Hash yang Diharapkan:", PASSWORD_HASH);
  
  return hashHex;
}

/**
 * Memeriksa status sesi admin saat halaman dimuat (Route Guard)
 * Diletakkan di bagian paling atas <head> untuk mencegah kedipan konten (Flicker)
 */
function checkAdminSession() {
  const sessionToken = sessionStorage.getItem(SESSION_KEY);
  const isLoginPage = window.location.pathname.endsWith("login.html");

  if (sessionToken) {
    // Sesi ada, jika admin mencoba mengakses login.html, alihkan langsung ke dashboard index.html
    if (isLoginPage) {
      console.log("[Auth] Sesi aktif terdeteksi. Mengalihkan ke Dashboard...");
      window.location.href = "admin-index.html";
    }
  } else {
    // Sesi tidak ada, jika mencoba mengakses halaman admin selain login.html, kunci & alihkan ke login.html
    if (!isLoginPage) {
      console.log("[Auth] Akses ditolak. Sesi tidak ditemukan. Mengalihkan ke Login...");
      window.location.href = "login.html";
    }
  }
}

/**
 * Menangani proses masuk (Login) Admin
 * @param {string} passwordInput - Password yang diketikkan di form
 * @param {Function} onSuccessCallback - Callback jika login sukses (misal: jalankan animasi sukses)
 * @param {Function} onErrorCallback - Callback jika login gagal (misal: tampilkan pesan error)
 */
async function handleAdminLogin(passwordInput, onSuccessCallback, onErrorCallback) {
  try {
    // Perbaikan: Lakukan pembersihan spasi di awal/akhir secara otomatis (Trimming)
    const cleanPassword = passwordInput ? passwordInput.trim() : "";
    
    if (!cleanPassword) {
      if (typeof onErrorCallback === "function") {
        onErrorCallback("Kata sandi tidak boleh kosong!");
      }
      return;
    }

    const computedHash = await hashPassword(cleanPassword);
    
    if (computedHash === PASSWORD_HASH) {
      // Buat token sesi acak berbasis timestamp
      const token = "session_" + btoa(Date.now().toString()) + "_" + Math.random().toString(36).substring(2);
      sessionStorage.setItem(SESSION_KEY, token);
      
      console.log("[Auth] Login Berhasil. Sesi dibuat.");
      if (typeof onSuccessCallback === "function") {
        onSuccessCallback();
      }
    } else {
      console.warn("[Auth] Login Gagal: Kata sandi tidak cocok.");
      if (typeof onErrorCallback === "function") {
        onErrorCallback("Kata sandi salah! Akses ditolak.");
      }
    }
  } catch (error) {
    console.error("[Auth] Terjadi kesalahan sistem enkripsi:", error);
    if (typeof onErrorCallback === "function") {
      onErrorCallback("Sistem kriptografi browser gagal memproses permintaan.");
    }
  }
}

/**
 * Menghapus sesi admin dan mengalihkan ke gerbang login
 */
function handleAdminLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  console.log("[Auth] Sesi dihapus. Keluar dari panel admin...");
  window.location.href = "login.html";
}