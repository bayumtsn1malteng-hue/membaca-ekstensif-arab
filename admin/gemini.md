##### 3.1. Fitur Input latihan dan Pratinjau user untuk latihan
	3.1.1. Tambahan fitur untuk input latihan dan pratinjau user untuk latihan. 
	3.1.2. Sarankan penambahan struktur database di spreadsheet dan perubahan di appscript
	3.1.3. Untuk saat ini (tahap MVP), fitur latihan terpisah dari bacaan. keduanya akan dihubungkan di tahap lanjut. buatkan file html khusus untuk latihan.html. struktur html ..\admin\admin-index.html sebagai basis untuk pengembangan latihan.html
	3.1.4. Pada tahap awal, fitur latihan hanya berupa pilihan ganda. opsi pilihan ganda bisa 4 atau lima.
	3.1.5. Jika memungkinkan, akan lebih baik bila html dipisahkan antara input bacaan dan input latihan. mungkin bisa menggunakan import/export module. misalnya, input bacaan di inputbacaan.html dan input latihan di inputlatihan.html. keduanya diakses dari index.html. (catatan: tetap menggunakan github pages)
	3.1.6 Penambahan tabsheet baru, bernama Pustaka_Latihan. konsekuensi: akan ada penambahan kode appscript. Struktur data base kira-kira akan seperti ini:
```js
{
    "Pustaka_Latihan":[
        "ID_Teks_Soal",
        "ID_Judul_Himpunan",
        "Teks_Soal",
        "Pilihan A",
        "Pilihan B",
        "Pilihan C",
        "Pilihan D",
        "Pilihan E",
        "Feedback Jawaban benar",
        "Feedback Jawaban benar"
    ]
}
```
	3.1.7. Navigasi input soal secara garis besar sama dengan input bacaan (Panel Pengelola Data v0.3.2-alpha) dengan desain UI yang sama, kecuali pada perilaku spesifik yang akan disebutkan. juga tetap mobile first
	3.1.8 Navigasi input soal menjadi 4: Input Teks Latihan, detail Kosakata, Pratinjau User. Tampilan dan perilaku sama dengan Panel Pengelola Data v0.3.2-alpha. Termasuk semua pop-up modal. 
	3.1.9. pemetaan kata, tetap masuk ke `Peta_Kosakata` untuk kata gabungan, `Kata_Induk` untuk kata induk, `Sambungan` untuk sambungan baru.
	3.10. khusus pada input teks latihan (Form Metadata Teks) urutannya menjadi berikut:

>[!caution] Struktur input ini belum fiks
>```
>seri soal
>---------
>Soal dan Pilihan Jawaban arab
>---------------------------
>soal dan pilihan jawaban indonesia.
>```


	
	
	
	
	3.11. soal latihan mungkin akan melibatkan tabel. perlu dipikirkan bagaimana jalan keluarnya. 
	3.12. Riwayat Pustaka Bacaan diganti menjadi riwayat pustaka soal dengan bagian: ID/Tanggal, Seri, Kesulitan, Jumlah soal di Seri, Aksi (akan ada peringatan bila Admin menekan ini, misalnya " ada yaking menghapus (n) soal? )




## STRUKTUR HEADER SPREADSHEET TABSHEET `Pustaka_Latihan` DAN `Judul_Himpunan_Latihan`
```js
{
    "Pustaka_Latihan": 
    ["ID_Himpunan_Latihan",	"ID_No_Soal",	"Judul_Himpunan_Latihan",	"Nomor_Soal",	"Teks_Soal",	"Pilihan_A",	"Pilihan_B",	"Pilihan_C",	"Pilihan_D",	"Pilihan_E", "Jawaban_Benar"	"Feedback_Jawaban_Benar",	"Feedback_Jawaban_Salah"]
    "Judul_Himpunan_Latihan":
    [ID_Himpunan_Latihan	Judul_Himpunan_Latihan	Jumlah_Soal_Terdaftar	ID_Soal_1	ID_Soal_2	ID_Soal_3	ID_Soal_4	ID_Soal_5	ID_Soal_6	ID_Soal_7	ID_Soal_8	ID_Soal_9	ID_Soal_10	ID_Soal_11	ID_Soal_12	ID_Soal_13	ID_Soal_14	ID_Soal_15	ID_Soal_16	ID_Soal_17	ID_Soal_18	ID_Soal_19	ID_Soal_20	ID_Soal_21	ID_Soal_22	ID_Soal_23	ID_Soal_24	ID_Soal_25	ID_Soal_26	ID_Soal_27	ID_Soal_28	ID_Soal_29	ID_Soal_30	ID_Soal_31	ID_Soal_32	ID_Soal_33	ID_Soal_34	ID_Soal_35	ID_Soal_36	ID_Soal_37	ID_Soal_38	ID_Soal_39	ID_Soal_40	ID_Soal_41	ID_Soal_42	ID_Soal_43	ID_Soal_44	ID_Soal_45	ID_Soal_46	ID_Soal_47	ID_Soal_48	ID_Soal_49	ID_Soal_50	ID_Soal_51	ID_Soal_52	ID_Soal_53	ID_Soal_54	ID_Soal_55	ID_Soal_56	ID_Soal_57	ID_Soal_58	ID_Soal_59	ID_Soal_60	ID_Soal_61	ID_Soal_62	ID_Soal_63	ID_Soal_64	ID_Soal_65	ID_Soal_66	ID_Soal_67	ID_Soal_68	ID_Soal_69	ID_Soal_70	ID_Soal_71	ID_Soal_72	ID_Soal_73	ID_Soal_74	ID_Soal_75	ID_Soal_76	ID_Soal_77	ID_Soal_78	ID_Soal_79	ID_Soal_80	ID_Soal_81	ID_Soal_82	ID_Soal_83	ID_Soal_84	ID_Soal_85	ID_Soal_86	ID_Soal_87	ID_Soal_88	ID_Soal_89	ID_Soal_90	ID_Soal_91	ID_Soal_92	ID_Soal_93	ID_Soal_94	ID_Soal_95	ID_Soal_96	ID_Soal_97	ID_Soal_98	ID_Soal_99	ID_Soal_100]
    }
```	
### Relasi `Pustaka_Latihan` dan `Judul_Himpunan_Soal`
1. Google appscripts akan mengambil dan mengirim data dari dan menuju kedua tabsheet. 
2. Setiap kali terdapat pemetaan baru, judul himpunan latihan akan dibuat ID_nya dan dikirim ke "Pustaka_Latihan" dan "Judul_Himpunan_Soal".
3. Jumlah_Soal_Terdaftar merupakan total soal yang sudah diterima di dalam himpunan latihan tertentu.
4. ID_Soal_{no} berasal dari nomor soal yang diinput. ID Soal antara ID_Soal_{no} di `Judul_Himpunan_Soal` dengan ID_No_Soal di `Pustaka_Latihan` harus sama sepanjang {no} cocok dengan "Nomor_Soal. Misal, ID_Soal_1, harus sama dengan ID_No_Soal pada Nomor_Soal=[1]