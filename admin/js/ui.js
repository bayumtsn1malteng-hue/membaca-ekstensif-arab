/**
 * MODUL PENGONTROL TAMPILAN (UI CONTROLLER)
 * Versi: v0.5.0-alpha.2
 * ID Unik: MEB-ADMIN-UI-001
 * * Modul ini menangani seluruh manipulasi DOM, pembuatan elemen visual, 
 * render tabel, animasi toast, modal dialog, dan saran otomatis (autocomplete).
 */

/**
 * Me-render visualisasi warna status kata Arab berdasarkan data pemetaan
 */
function renderLiveArabicFeedback() {
  const container = document.getElementById("live-arabic-container");
  if (!stateActiveText.Konten_Arab) {
    container.innerHTML = `<span class="text-slate-400 text-sm font-sans">Belum ada bacaan aktif yang diinput.</span>`;
    return;
  }

  const rawWords = stateActiveText.Konten_Arab.trim().replace(/\s+/g, ' ').split(' ');
  container.innerHTML = "";

  rawWords.forEach(word => {
    const cleaned = cleanArabicDiacritics(word);
    const vocabMatch = dbPetaKosakata.find(v => v.Kata_Teks_Polos === cleaned);
    const directIndukMatch = dbKataInduk.find(i => i.Kata_Induk_Polos === cleaned);
    
    let textColorClass = "text-slate-900 bg-white border border-slate-200 hover:bg-slate-100"; 
    let titleTooltip = "Belum terpetakan (Kosakata Baru)";

    if (directIndukMatch) {
      textColorClass = "text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold hover:bg-emerald-100";
      titleTooltip = `Terpetakan (Kata Induk): ${directIndukMatch.Kata_Induk}`;
    } else if (vocabMatch) {
      if (vocabMatch.ID_Kata_Induk) {
        textColorClass = "text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold hover:bg-emerald-100";
        const parent = dbKataInduk.find(i => i.ID_Kata_Induk === vocabMatch.ID_Kata_Induk);
        titleTooltip = `Terpetakan - Induk: ${parent ? parent.Kata_Induk : 'Error'}`;
      } else {
        textColorClass = "text-amber-700 bg-amber-50 border border-amber-200 font-semibold hover:bg-amber-100";
        titleTooltip = "Peringatan: Tanpa Kata Induk!";
      }
    }

    const span = document.createElement("span");
    span.className = `active-tap text-xl sm:text-2xl font-arabic py-1.5 px-3.5 rounded-xl shadow-xs transition duration-150 cursor-pointer ${textColorClass}`;
    span.innerText = word;
    span.title = titleTooltip;
    
    span.onclick = function() {
      openVocabPopupForWord(word, cleaned);
    };

    container.appendChild(span);
  });
}

/**
 * Me-render daftar pustaka bacaan pada tabel riwayat
 */
function renderPustakaTable() {
  const tbody = document.getElementById("table-pustaka-body");
  tbody.innerHTML = "";

  if (dbPustaka.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-slate-400 text-xs">Belum ada pustaka bacaan.</td></tr>`;
    return;
  }

  dbPustaka.forEach(text => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/50 cursor-pointer";
    tr.onclick = function() {
      loadSelectedTextIntoState(text);
      showToast(`Naskah "${text.Judul_Teks}" aktif.`, "info");
    };

    tr.innerHTML = `
    <td class="py-3 px-3 font-mono text-[10px] sm:text-xs">
      <span class="block font-bold text-slate-700">${text.ID_Teks}</span>
      <span class="text-slate-400">${text.Tanggal_Rilis}</span>
    </td>
    <td class="py-3 px-3 font-semibold text-slate-800">
      <span class="block text-[10px] text-indigo-500 font-bold">${text.Seri}</span>
      <span class="block text-right font-arabic font-bold text-slate-700" dir="rtl">${text.Judul_Teks_Arab || text.Judul_Teks}</span>
      <span class="text-xs text-slate-500 italic block mt-0.5">${text.Terjemah_Judul_Indonesia || text.Judul_Teks}</span>
    </td>
    <td class="py-3 px-3">
      <span class="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-100">${text.Tingkat_Kesulitan}</span>
    </td>
    <td dir="rtl" class="py-3 px-3 font-arabic text-lg sm:text-xl text-right truncate max-w-[140px]">
      ${text.Konten_Arab}
    </td>
    <td class="py-3 px-3 text-right">
      <button onclick="event.stopPropagation(); deletePustaka('${text.ID_Teks}')" class="text-slate-400 hover:text-rose-600 p-2 rounded-lg active-tap transition inline-flex items-center justify-center bg-slate-50 border border-slate-200/60 hover:bg-rose-50" title="Hapus Naskah">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Me-render antrean kata baru dan kosakata terdaftar pada tab detail kosakata
 */
function renderQueueTable() {
  const tbody = document.getElementById("table-queue-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const searchVal = document.getElementById("search-queue").value.toLowerCase();
  const limit = parseInt(document.getElementById("vocab-limit-select").value) || 50;
  
  let itemsToRender = [];

  if (stateWordQueue.length > 0) {
    itemsToRender = [...stateWordQueue];
  } else {
    const mappedFromPeta = dbPetaKosakata.map(item => ({
      id_teks: item.ID_Teks,
      id_vocab: item.ID_Kosakata,
      word_raw: item.Kata_Teks,
      word_clean: item.Kata_Teks_Polos,
      status: "Tersimpan di Sheet (Gabungan)",
      type: "Gabungan"
    }));

    const mappedFromInduk = dbKataInduk.map(item => ({
      id_teks: "KATA-ROOT",
      id_vocab: item.ID_Kata_Induk,
      word_raw: item.Kata_Induk,
      word_clean: item.Kata_Induk_Polos,
      status: "Tersimpan di Sheet (Induk)",
      type: "Induk"
    }));

    const seenClean = new Set();
    itemsToRender = [...mappedFromPeta, ...mappedFromInduk].filter(item => {
      if (seenClean.has(item.word_clean)) return false;
      seenClean.add(item.word_clean);
      return true;
    });
  }

  if (searchVal) {
    itemsToRender = itemsToRender.filter(item => 
      item.word_raw.toLowerCase().includes(searchVal) || 
      item.word_clean.toLowerCase().includes(searchVal)
    );
  }

  if (itemsToRender.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-6 text-center text-slate-400 text-xs">Tidak ada kosakata yang tersimpan di database.</td></tr>`;
    return;
  }

  const slicedItems = itemsToRender.slice(0, limit);

  slicedItems.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/50";

    let badgeClass = "bg-slate-100 text-slate-700";
    if (item.status === "Antrean Baru") badgeClass = "bg-rose-50 text-rose-700 border border-rose-100 font-semibold";
    if (item.status === "Tersimpan di Sheet (Induk)") badgeClass = "bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold";
    if (item.status === "Tersimpan di Sheet (Gabungan)") badgeClass = "bg-sky-50 text-sky-700 border border-sky-100";

    const matchVocab = dbPetaKosakata.find(v => v.Kata_Teks_Polos === item.word_clean);
    const matchParent = matchVocab && matchVocab.ID_Kata_Induk ? dbKataInduk.find(i => i.ID_Kata_Induk === matchVocab.ID_Kata_Induk) : null;
    const directInduk = dbKataInduk.find(i => i.Kata_Induk_Polos === item.word_clean);
    
    let relasiInfo = `<span class="text-slate-400 italic text-xs">Belum dihubungkan</span>`;
    if (directInduk) {
      relasiInfo = `
      <div class="text-xs">
        <span class="font-bold text-emerald-700 block">${directInduk.Arti_Kata_Induk}</span>
        <span class="text-[10px] text-slate-400">Tipe: Kata Induk / Root Utama</span>
      </div>
      `;
    } else if (matchVocab && matchParent) {
      relasiInfo = `
      <div class="text-xs">
        <span class="font-bold text-slate-700 block">${matchVocab.Arti_Kata_Teks}</span>
        <span class="text-slate-400">Induk: ${matchParent.Kata_Induk} (${matchParent.Arti_Kata_Induk})</span>
      </div>
      `;
    } else if (matchVocab) {
      relasiInfo = `
      <div class="text-xs">
        <span class="font-bold text-slate-700 block">${matchVocab.Arti_Kata_Teks}</span>
        <span class="text-amber-500 font-semibold block mt-0.5">⚠️ Kuning: Tanpa Kata Induk</span>
      </div>
      `;
    }

    let deleteBtnHtml = "";
    const actualId = item.id_vocab || (matchVocab ? matchVocab.ID_Kosakata : (directInduk ? directInduk.ID_Kata_Induk : null));
    const actualType = directInduk ? "Induk" : "Gabungan";
    
    if (actualId) {
      deleteBtnHtml = `
      <button onclick="event.stopPropagation(); deleteVocab('${actualId}', '${actualType}')" class="active-tap p-2 rounded-lg text-slate-400 hover:text-rose-600 transition inline-flex items-center justify-center bg-slate-50 border border-slate-200" title="Hapus Pemetaan">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      `;
    }

    tr.innerHTML = `
    <td dir="rtl" class="py-3 px-4 font-arabic text-2xl text-right">
      ${item.word_raw}
    </td>
    <td dir="rtl" class="py-3 px-4 font-arabic text-2xl text-right text-indigo-600">
      ${item.word_clean}
    </td>
    <td class="py-3 px-4">
      <span class="text-[10px] px-2.5 py-1 rounded-full ${badgeClass}">${item.status}</span>
    </td>
    <td class="py-3 px-4">
      ${relasiInfo}
    </td>
    <td class="py-3 px-4 text-center flex items-center justify-center space-x-2">
      <button onclick="openVocabPopupForWord('${item.word_raw}', '${item.word_clean}')" class="active-tap px-4 py-2.5 sm:py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs hover:shadow mr-1">
        Petakan Detail
      </button>
      ${deleteBtnHtml}
    </td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Membuka jendela dialog pemetaan kosakata
 */
function openVocabPopupForWord(raw, clean) {
  stateActiveWord = { raw, clean };

  document.getElementById("mapper-active-word").value = raw;
  document.getElementById("mapper-clean-word").innerText = `Versi Bersih (Syaddah bertahan): ${clean}`;
  
  document.getElementById("mapper-arti-teks").value = "";
  document.getElementById("gabungan-kata-induk").value = clean; 
  document.getElementById("gabungan-arti-induk").value = "";
  document.getElementById("gabungan-id-induk").value = "";
  
  document.getElementById("sambungan-rows-container").innerHTML = "";

  const directInduk = dbKataInduk.find(i => i.Kata_Induk_Polos === clean);
  const matchVocab = dbPetaKosakata.find(v => v.Kata_Teks_Polos === clean);

  if (directInduk) {
    document.getElementById("mapper-arti-teks").value = directInduk.Arti_Kata_Induk;
    document.querySelector('input[name="input-jenis-kata"][value="Induk"]').checked = true;
  } else {
    document.querySelector('input[name="input-jenis-kata"][value="Gabungan"]').checked = true;
    
    const stemResult = arabicLightStemmer(clean);
    if (stemResult.stem && stemResult.stem !== clean) {
      const potentialParent = dbKataInduk.find(i => i.Kata_Induk_Polos === stemResult.stem);
      if (potentialParent) {
        document.getElementById("gabungan-kata-induk").value = potentialParent.Kata_Induk;
        document.getElementById("gabungan-arti-induk").value = potentialParent.Arti_Kata_Induk;
        document.getElementById("gabungan-id-induk").value = potentialParent.ID_Kata_Induk;
      } else {
        document.getElementById("gabungan-kata-induk").value = stemResult.stem;
      }

      if (stemResult.prefix) {
        addSambunganRow("Sambungan_Awal_1", stemResult.prefix);
      }
      if (stemResult.suffix) {
        addSambunganRow("Sambungan_Akhir_1", stemResult.suffix);
      }
    }
  }

  if (matchVocab) {
    document.getElementById("mapper-arti-teks").value = matchVocab.Arti_Kata_Teks;
    
    if (matchVocab.ID_Kata_Induk) {
      const matchInduk = dbKataInduk.find(i => i.ID_Kata_Induk === matchVocab.ID_Kata_Induk);
      if (matchInduk) {
        document.getElementById("gabungan-kata-induk").value = matchInduk.Kata_Induk;
        document.getElementById("gabungan-arti-induk").value = matchInduk.Arti_Kata_Induk;
        document.getElementById("gabungan-id-induk").value = matchInduk.ID_Kata_Induk;
      }
    }

    const slots = [
      { key: "Sambungan_Awal_1" }, { key: "Sambungan_Awal_2" }, { key: "Sambungan_Awal_3" },
      { key: "Sambungan_Akhir_1" }, { key: "Sambungan_Akhir_2" }, { key: "Sambungan_Akhir_3" }
    ];

    document.getElementById("sambungan-rows-container").innerHTML = "";
    slots.forEach(slot => {
      const val = matchVocab[slot.key]; 
      if (val) {
        const matchSamb = dbMasterSambungan.find(s => s.ID_Sambungan === val || s.Bentuk_Sambungan === val);
        const bentukVisual = matchSamb ? matchSamb.Bentuk_Sambungan : val;
        addSambunganRow(slot.key, bentukVisual);
      }
    });
  }

  toggleJenisKataForm();
  document.getElementById("modal-vocab-mapper").classList.remove("hidden");
}

function closeVocabModal() {
  document.getElementById("modal-vocab-mapper").classList.add("hidden");
}

function toggleJenisKataForm() {
  const jenisVal = document.querySelector('input[name="input-jenis-kata"]:checked').value;
  const panelGabungan = document.getElementById("panel-jenis-gabungan");

  if (jenisVal === "Induk") {
    panelGabungan.classList.add("hidden");
  } else {
    panelGabungan.classList.remove("hidden");
  }
}

/**
 * Menampilkan rekomendasi kata induk secara cerdas (Autocomplete)
 */
function showKataIndukAutocomplete(val) {
  const wrapper = document.getElementById("autocomplete-results-gabungan");
  if (!wrapper) return;
  wrapper.innerHTML = "";

  if (!val.trim()) {
    wrapper.classList.add("hidden");
    return;
  }

  const searchVal = val.toLowerCase();
  const matched = dbKataInduk.filter(i => 
    i.Kata_Induk.toLowerCase().includes(searchVal) || 
    i.Kata_Induk_Polos.toLowerCase().includes(searchVal) ||
    i.Arti_Kata_Induk.toLowerCase().includes(searchVal)
  );

  if (matched.length === 0) {
    wrapper.innerHTML = `
    <div class="p-3 text-slate-400 italic text-xs">Kata induk tidak ditemukan. Ketik manual & simpan baru.</div>
    `;
    wrapper.classList.remove("hidden");
    return;
  }

  matched.forEach(item => {
    const div = document.createElement("div");
    div.className = "p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 min-h-[44px] active-tap";
    div.onclick = function() {
      document.getElementById("gabungan-kata-induk").value = item.Kata_Induk;
      document.getElementById("gabungan-arti-induk").value = item.Arti_Kata_Induk;
      document.getElementById("gabungan-id-induk").value = item.ID_Kata_Induk;
      wrapper.classList.add("hidden");
    };
    div.innerHTML = `
    <span class="font-semibold text-slate-700 text-xs">${item.Arti_Kata_Induk}</span>
    <span class="font-arabic text-sm text-indigo-600 font-bold" dir="rtl">${item.Kata_Induk}</span>
    `;
    wrapper.appendChild(div);
  });

  wrapper.classList.remove("hidden");
}

/**
 * Menambahkan baris identifikasi imbuhan sambungan (afiks) baru di modal popup
 */
function addSambunganRow(selectedSlot = "", selectedBentuk = "") {
  const container = document.getElementById("sambungan-rows-container");
  const index = container.children.length;

  const row = document.createElement("div");
  row.className = "grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 p-3 sm:p-2 rounded-xl border border-slate-100 shadow-2xs relative group";

  const slots = [
    { val: "Sambungan_Awal_1", txt: "Sambungan Awal 1" },
    { val: "Sambungan_Awal_2", txt: "Sambungan Awal 2" },
    { val: "Sambungan_Awal_3", txt: "Sambungan Awal 3" },
    { val: "Sambungan_Akhir_1", txt: "Sambungan Akhir 1" },
    { val: "Sambungan_Akhir_2", txt: "Sambungan Akhir 2" },
    { val: "Sambungan_Akhir_3", txt: "Sambungan Akhir 3" }
  ];

  let optionsHtml = slots.map(s => 
    `<option value="${s.val}" ${selectedSlot === s.val ? "selected" : ""}>${s.txt}</option>`
  ).join('');

  row.innerHTML = `
  <div>
    <label class="block sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Letak Kolom</label>
    <select class="row-slot w-full px-2.5 py-2.5 sm:py-1.5 rounded-lg border border-slate-200 outline-none text-xs bg-white">
      ${optionsHtml}
    </select>
  </div>
  <div class="relative">
    <label class="block sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bentuk</label>
    <input type="text" value="${selectedBentuk}" oninput="showSambunganAutocomplete(this, ${index})" class="row-bentuk w-full px-2.5 py-2.5 sm:py-1.5 rounded-lg border border-slate-200 outline-none text-xs text-right font-arabic font-bold bg-white" placeholder="Contoh: لـ" required>
    <div class="bentuk-autocomplete-box absolute left-0 right-0 z-30 mt-1 max-h-24 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-[10px] hidden custom-scrollbar"></div>
  </div>
  <div class="flex items-center space-x-1.5 pr-8 sm:pr-0">
    <div class="w-full">
      <label class="block sm:hidden text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fungsi Sambungan</label>
      <input type="text" readonly class="row-fungsi w-full px-2.5 py-2.5 sm:py-1.5 rounded-lg border border-slate-200 sm:border-slate-100 outline-none text-[10px] bg-slate-100 text-slate-500" placeholder="Fungsi otomatis...">
    </div>
  </div>
  <button type="button" onclick="this.parentElement.remove()" class="absolute right-3 top-3 sm:top-2 text-slate-400 hover:text-rose-500 transition p-1 rounded-lg bg-white sm:bg-transparent border border-slate-200 sm:border-0 active-tap">
    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  </button>
  `;

  container.appendChild(row);

  if (selectedBentuk) {
    const shapeInput = row.querySelector(".row-bentuk");
    fillSambunganFungsi(shapeInput, selectedBentuk);
  }
}

function showSambunganAutocomplete(inputEl, rowIndex) {
  const val = inputEl.value;
  const row = inputEl.parentElement.parentElement;
  const box = inputEl.parentElement.querySelector(".bentuk-autocomplete-box");
  box.innerHTML = "";

  if (!val.trim()) {
    box.classList.add("hidden");
    return;
  }

  const matched = dbMasterSambungan.filter(s => s.Bentuk_Sambungan.includes(val));

  if (matched.length === 0) {
    box.innerHTML = `<div class="p-2 text-slate-400 italic">Bentuk baru</div>`;
    box.classList.remove("hidden");
    return;
  }

  matched.forEach(item => {
    const div = document.createElement("div");
    div.className = "p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 min-h-[38px] active-tap";
    div.onclick = function() {
      inputEl.value = item.Bentuk_Sambungan;
      row.querySelector(".row-fungsi").value = item.Fungsi_Sambungan || item.Jenis_Sambungan || "";
      box.classList.add("hidden");
    };
    div.innerHTML = `
      <span class="text-slate-400 text-[9px]">${item.Fungsi_Sambungan || item.Jenis_Sambungan || ""}</span>
      <span class="font-arabic font-bold text-indigo-600">${item.Bentuk_Sambungan}</span>
    `;
    box.appendChild(div);
  });

  box.classList.remove("hidden");
}

function fillSambunganFungsi(inputEl, val) {
  const row = inputEl.parentElement.parentElement;
  const match = dbMasterSambungan.find(s => s.Bentuk_Sambungan === val);
  if (match) {
    row.querySelector(".row-fungsi").value = match.Fungsi_Sambungan || match.Jenis_Sambungan || "";
  }
}

/**
 * Me-render pratinjau teks pembaca di sisi User
 */
function renderUserReader() {
  document.getElementById("preview-judul-teks").innerText = stateActiveText.Judul_Teks_Arab || "نُوحٌ وَالسَّفِينَةُ";
  document.getElementById("preview-judul-terjemah").innerText = stateActiveText.Terjemah_Judul_Indonesia || "Nabi Nuh dan Bahtera";
  document.getElementById("preview-seri-badge").innerText = stateActiveText.Seri || "N/A";
  document.getElementById("preview-kesulitan-badge").innerText = stateActiveText.Tingkat_Kesulitan || "N/A";
  document.getElementById("preview-terjemah-teks").innerText = stateActiveText.Terjemah_Indonesia || "Silakan masukkan naskah di tab Input Bacaan.";

  const container = document.getElementById("user-reader-container");
  container.innerHTML = "";

  if (!stateActiveText.Konten_Arab) {
    container.innerHTML = `<span class="text-slate-400 text-sm font-sans">Belum ada bacaan aktif.</span>`;
    return;
  }

  const rawWords = stateActiveText.Konten_Arab.trim().replace(/\s+/g, ' ').split(' ');

  rawWords.forEach(word => {
    const cleaned = cleanArabicDiacritics(word);
    const span = document.createElement("span");
    span.className = "active-tap text-slate-800 hover:text-indigo-600 hover:bg-indigo-50/50 py-1.5 px-3 rounded-xl transition-all duration-150 cursor-pointer text-xl sm:text-2xl font-arabic";
    span.innerText = word;
    
    span.onclick = function() {
      openUserWordModal(word, cleaned);
    };

    container.appendChild(span);
  });
}

/**
 * Membuka lembar detail kosakata instan dari sudut pandang pembaca User (Pratinjau)
 */
function openUserWordModal(raw, clean) {
  const vocabMatch = dbPetaKosakata.find(v => v.Kata_Teks_Polos === clean);
  const directInduk = dbKataInduk.find(i => i.Kata_Induk_Polos === clean);

  document.getElementById("user-modal-kata-teks").innerText = raw;
  document.getElementById("user-modal-arti-teks").innerText = "Arti kata belum dipetakan admin.";
  
  document.getElementById("user-modal-kata-induk").innerText = "-";
  document.getElementById("user-modal-arti-induk").innerText = "-";
  document.getElementById("user-modal-kategori").innerText = "-";
  document.getElementById("user-modal-sambungan-awal").innerText = "-";
  document.getElementById("user-modal-sambungan-akhir").innerText = "-";

  document.getElementById("user-modal-induk-kata").innerText = "-";
  document.getElementById("user-modal-induk-kategori").innerText = "-";
  document.getElementById("user-modal-induk-arti").innerText = "-";

  const relasiSectionModeA = document.getElementById("user-modal-induk-asli-layout");
  const relasiSectionModeB = document.getElementById("user-modal-relasi-section");

  let hasImbuhan = false;
  if (vocabMatch) {
    const awals = [vocabMatch.Sambungan_Awal_1, vocabMatch.Sambungan_Awal_2, vocabMatch.Sambungan_Awal_3].filter(Boolean);
    const akhirs = [vocabMatch.Sambungan_Akhir_1, vocabMatch.Sambungan_Akhir_2, vocabMatch.Sambungan_Akhir_3].filter(Boolean);
    if (awals.length > 0 || akhirs.length > 0) {
      hasImbuhan = true;
    }
  }

  const translateIdToVisual = (val) => {
    if (!val) return "";
    const match = dbMasterSambungan.find(s => s.ID_Sambungan === val || s.Bentuk_Sambungan === val);
    return match ? match.Bentuk_Sambungan : val;
  };

  if (directInduk && !hasImbuhan) {
    document.getElementById("user-modal-arti-teks").innerText = directInduk.Arti_Kata_Induk;
    
    relasiSectionModeA.classList.remove("hidden");
    relasiSectionModeB.classList.add("hidden");

    document.getElementById("user-modal-induk-kata").innerText = directInduk.Kata_Induk; 
    document.getElementById("user-modal-induk-kategori").innerText = directInduk.Kategori || "Isim";
    document.getElementById("user-modal-induk-arti").innerText = directInduk.Arti_Kata_Induk;

  } else if (vocabMatch) {
    document.getElementById("user-modal-arti-teks").innerText = vocabMatch.Arti_Kata_Teks;
    
    relasiSectionModeA.classList.add("hidden");
    relasiSectionModeB.classList.remove("hidden");

    const awals = [vocabMatch.Sambungan_Awal_1, vocabMatch.Sambungan_Awal_2, vocabMatch.Sambungan_Awal_3]
      .filter(Boolean)
      .map(translateIdToVisual);
    document.getElementById("user-modal-sambungan-awal").innerText = awals.length > 0 ? awals.join(" + ") : "-";

    const akhirs = [vocabMatch.Sambungan_Akhir_1, vocabMatch.Sambungan_Akhir_2, vocabMatch.Sambungan_Akhir_3]
      .filter(Boolean)
      .map(translateIdToVisual);
    document.getElementById("user-modal-sambungan-akhir").innerText = akhirs.length > 0 ? akhirs.join(" + ") : "-";

    if (vocabMatch.ID_Kata_Induk) {
      const parentMatch = dbKataInduk.find(i => i.ID_Kata_Induk === vocabMatch.ID_Kata_Induk);
      if (parentMatch) {
        document.getElementById("user-modal-kata-induk").innerText = parentMatch.Kata_Induk; 
        document.getElementById("user-modal-arti-induk").innerText = parentMatch.Arti_Kata_Induk; 
        document.getElementById("user-modal-kategori").innerText = parentMatch.Kategori || "Isim";
      }
    }
  } else {
    relasiSectionModeA.classList.add("hidden");
    relasiSectionModeB.classList.add("hidden");
  }

  document.getElementById("backlog-turunan").classList.add("hidden");
  document.getElementById("backlog-kalimat").classList.add("hidden");

  document.getElementById("modal-user-word").classList.remove("hidden");
}

function closeUserWordModal() {
  document.getElementById("modal-user-word").classList.add("hidden");
}

function toggleBacklogAccordion(id) {
  const el = document.getElementById(id);
  if (el.classList.contains("hidden")) {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}