# Page Resumer

## Ringkasan / Overview

Page Resumer adalah ekstensi Chrome yang membuat ringkasan halaman web dan menjawab pertanyaan berdasarkan konten halaman tersebut menggunakan teknologi AI Gemini. Ekstensi ini sangat berguna untuk membaca cepat artikel panjang, riset akademik, atau konten web lainnya.

Page Resumer is a Chrome extension that summarizes web pages and answers questions based on their content using Gemini AI technology. This extension is extremely useful for quickly reading long articles, academic research, or any other web content.

## Fitur / Features

- **Ringkasan Otomatis / Automatic Summary:** Mengubah halaman web panjang menjadi ringkasan yang mudah dibaca
- **Tanya AI / Ask AI:** Tanyakan pertanyaan spesifik tentang konten halaman
- **Riwayat / History:** Simpan ringkasan dan pertanyaan sebelumnya untuk referensi di masa mendatang
- **Ekspor PDF / PDF Export:** Simpan ringkasan dan riwayat sebagai dokumen PDF
- **Dukungan Bahasa / Language Support:** Tersedia dalam Bahasa Inggris dan Bahasa Indonesia
- **Penyimpanan Awan / Cloud Storage:** Riwayat dan pengaturan disimpan secara lokal di perangkat Anda

## Cara Menggunakan / How to Use

### Instalasi / Installation

1. **Unduh Ekstensi / Download Extension:**
   - Clone atau unduh repositori ini
   - Buka direktori yang berisi file-file ekstensi

2. **Instal di Chrome / Install in Chrome:**
   - Buka Chrome dan ketik `chrome://extensions/` di bilah alamat
   - Aktifkan "Mode Pengembang" (sudut kanan atas)
   - Klik "Load unpacked"
   - Pilih direktori yang berisi file-file ekstensi

3. **Pengaturan Awal / Initial Setup:**
   - Saat pertama kali menggunakan, Anda perlu memasukkan API key Gemini
   - Dapatkan API key dari [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Masukkan API key pada layar setup atau pada tab Pengaturan

### Menggunakan Ekstensi / Using the Extension

#### 1. Membuat Ringkasan / Creating a Summary

1. Kunjungi halaman web yang ingin diringkas
2. Klik ikon ekstensi Page Resumer di bilah alat browser
3. Pada tab "Summarize", klik tombol "Generate Resume"
4. Tunggu beberapa saat, ringkasan akan muncul pada area hasil
5. Gunakan tombol "Copy" untuk menyalin ringkasan ke clipboard
6. Gunakan tombol "Export PDF" untuk menyimpan ringkasan sebagai PDF

#### 2. Bertanya Tentang Konten / Asking About Content

1. Kunjungi halaman web yang ingin ditanyakan
2. Klik ikon ekstensi Page Resumer
3. Pilih tab "Ask AI"
4. Ketik pertanyaan Anda di kotak input
5. Klik tombol "Ask AI"
6. Tunggu beberapa saat, jawaban akan muncul pada area hasil
7. Gunakan tombol "Copy" untuk menyalin jawaban ke clipboard

#### 3. Melihat Riwayat / Viewing History

1. Klik ikon ekstensi Page Resumer
2. Pilih tab "History"
3. Klik pada item riwayat untuk melihat ringkasan atau jawaban lengkap
4. Gunakan tombol "Clear History" untuk menghapus semua riwayat
5. Gunakan tombol "Export PDF" untuk menyimpan seluruh riwayat sebagai PDF

#### 4. Mengubah Pengaturan / Changing Settings

1. Klik ikon ekstensi Page Resumer
2. Pilih tab "Settings"
3. Untuk mengubah API key, masukkan API key baru dan klik "Save"
4. Untuk mengubah bahasa, pilih "English" atau "Indonesian"

## Persyaratan / Requirements

- Browser Google Chrome (versi terbaru direkomendasikan)
- API key dari [Google AI Studio](https://aistudio.google.com/app/apikey)
- Koneksi internet aktif untuk mengakses API Gemini

## Tips Penggunaan / Usage Tips

- Semakin jelas konten yang ada pada halaman web, semakin baik hasil ringkasan
- Untuk pertanyaan yang kompleks, gunakan bahasa yang jelas dan spesifik
- Ringkasan dan jawaban lebih baik untuk artikel teks, halaman blog, dan publikasi berita
- API Gemini memiliki batas ukuran teks (25,000 karakter), jadi pada halaman yang sangat panjang, hanya sebagian konten yang mungkin diringkas

## Pemecahan Masalah / Troubleshooting

- **Error API Key:** Pastikan Anda memasukkan API key Gemini yang valid pada tab Pengaturan
- **Tidak Ada Konten yang Diambil:** Beberapa halaman web mungkin memiliki struktur yang tidak standar dan sulit untuk mengekstrak kontennya
- **Rate Limit Exceeded:** Jika Anda menerima error ini, Anda mungkin telah mencapai batas penggunaan API Gemini; Coba lagi nanti
- **Hasil Timeout:** Beberapa halaman mungkin memerlukan waktu lebih lama untuk diproses; Coba lagi dengan konten yang lebih pendek

## Privasi / Privacy

- Semua konten halaman web dan riwayat disimpan secara lokal di perangkat Anda
- API key Anda hanya digunakan untuk permintaan ke API Gemini dan disimpan secara lokal

## Lisensi / License

Page Resumer dilisensikan di bawah [Lisensi MIT](LICENSE). Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode ini sesuai dengan ketentuan lisensi tersebut.

Page Resumer is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this code according to the terms of this license.

---

Page Resumer dibuat untuk membantu Anda menghemat waktu dan meningkatkan pemahaman saat menjelajahi web. Jika Anda memiliki saran atau mengalami masalah, silakan buat issue di repositori ini.