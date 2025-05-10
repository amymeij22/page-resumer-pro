# Page Resumer Pro

## Ringkasan / Overview

Page Resumer Pro adalah ekstensi Chrome yang membuat ringkasan halaman web dan menjawab pertanyaan berdasarkan konten halaman tersebut menggunakan teknologi AI Gemini. Ekstensi ini sangat berguna untuk membaca cepat artikel panjang, riset akademik, atau konten web lainnya.

Page Resumer Pro is a Chrome extension that summarizes web pages and answers questions based on their content using Gemini AI technology. This extension is extremely useful for quickly reading long articles, academic research, or any other web content.

## Fitur / Features

- **Ringkasan Otomatis / Automatic Summary:** Mengubah halaman web panjang menjadi ringkasan yang mudah dibaca
- **Tanya AI / Ask AI:** Tanyakan pertanyaan spesifik tentang konten halaman
- **Riwayat / History:** Simpan ringkasan dan pertanyaan sebelumnya untuk referensi di masa mendatang
- **Ekspor PDF / PDF Export:** Simpan ringkasan dan riwayat sebagai dokumen PDF
- **Dukungan Bahasa / Language Support:** Tersedia dalam Bahasa Inggris dan Bahasa Indonesia
- **Penyimpanan Lokal / Local Storage:** Riwayat dan pengaturan disimpan secara lokal di perangkat Anda
- **Mode Tema / Theme Mode:** Dapat beralih antara tema terang dan gelap sesuai preferensi Anda
- **Gaya Jawaban / Answer Styles:** Pilih gaya jawaban berbeda (standar, sederhana, teknis, ELI5, berfokus pada kode)
- **Konteks Percakapan / Conversation Context:** Pertanyaan lanjutan mengingat konteks percakapan sebelumnya
- **Penandaan / Tagging:** Tambahkan tag ke item riwayat untuk pengorganisasian yang lebih baik
- **Penyaringan Riwayat / History Filtering:** Filter riwayat berdasarkan situs web, tag, atau jenis
- **Pilihan Multi-Item / Multi-Item Selection:** Pilih beberapa item riwayat untuk diekspor
- **Pintasan Keyboard / Keyboard Shortcuts:** Akses cepat dengan pintasan kustom

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
2. Klik ikon ekstensi Page Resumer Pro di bilah alat browser atau gunakan pintasan keyboard (default: Ctrl+Q / Command+Q)
3. Pada tab "Summarize", klik tombol "Generate Resume"
4. Tunggu beberapa saat, ringkasan akan muncul pada area hasil
5. Gunakan tombol "Copy" untuk menyalin ringkasan ke clipboard
6. Gunakan tombol "Export PDF" untuk menyimpan ringkasan sebagai PDF

#### 2. Bertanya Tentang Konten / Asking About Content

1. Kunjungi halaman web yang ingin ditanyakan
2. Klik ikon ekstensi Page Resumer Pro
3. Pilih tab "Ask AI"
4. (Opsional) Pilih sumber untuk pertanyaan:
   - "Use page content" - menggunakan konten halaman penuh
   - "Use summary" - menggunakan ringkasan yang telah dibuat
5. (Opsional) Pilih gaya jawaban (standar, bahasa sederhana, teknis, ELI5, berfokus pada kode)
6. Ketik pertanyaan Anda di kotak input
7. Klik tombol "Ask AI"
8. Tunggu beberapa saat, jawaban akan muncul pada area hasil
9. Gunakan tombol "Copy" untuk menyalin jawaban ke clipboard
10. Pertanyaan lanjutan akan mempertahankan konteks percakapan sebelumnya

#### 3. Melihat dan Mengelola Riwayat / Viewing and Managing History

1. Klik ikon ekstensi Page Resumer Pro
2. Pilih tab "History"
3. Gunakan kotak pencarian untuk menemukan item tertentu
4. Filter riwayat berdasarkan:
   - Situs web tertentu
   - Tag tertentu
   - Tipe item (ringkasan atau pertanyaan)
5. Klik pada item riwayat untuk melihat detail lengkap
6. Tambahkan tag ke item untuk pengorganisasian yang lebih baik
7. Pilih beberapa item dengan mengklik "Select Items"
8. Gunakan tombol "Clear History" untuk menghapus semua riwayat
9. Gunakan tombol "Export PDF" untuk menyimpan seluruh riwayat atau item terpilih sebagai PDF

#### 4. Mengubah Pengaturan / Changing Settings

1. Klik ikon ekstensi Page Resumer Pro
2. Pilih tab "Settings"
3. Untuk mengubah API key:
   - Masukkan API key baru di kolom input
   - Klik "Save"
4. Untuk mengubah bahasa, pilih "English" atau "Indonesian"
5. Pintasan keyboard dapat diubah melalui halaman pengaturan ekstensi Chrome
6. Klik ikon tema di sudut kanan atas untuk beralih antara mode terang dan gelap

## Persyaratan / Requirements

- Browser Google Chrome (versi terbaru direkomendasikan)
- API key dari [Google AI Studio](https://aistudio.google.com/app/apikey)
- Koneksi internet aktif untuk mengakses API Gemini

## Tips Penggunaan / Usage Tips

- Aktifkan mode gelap untuk penggunaan pada malam hari yang lebih nyaman untuk mata
- Gunakan gaya jawaban berbeda berdasarkan kebutuhan Anda:
  - "Standard" untuk jawaban berimbang
  - "Simple language" untuk jawaban yang mudah dipahami
  - "Technical/detailed" untuk jawaban mendalam
  - "Explain like I'm 5" (ELI5) untuk penjelasan sangat sederhana
  - "Code examples" untuk jawaban dengan fokus pada contoh kode (untuk konten pemrograman)
- Gunakan tag untuk mengorganisasi riwayat berdasarkan topik, proyek, atau kategori
- Pilih "Use summary" saat bertanya tentang hal umum untuk mendapatkan jawaban lebih cepat
- Pilih "Use page content" saat bertanya tentang detail spesifik yang mungkin tidak tercakup dalam ringkasan
- Konteks percakapan disimpan per tab, jadi Anda dapat memiliki beberapa percakapan berbeda sekaligus
- Gunakan pintasan keyboard (Ctrl+Q / Command+Q) untuk akses cepat

## Pemecahan Masalah / Troubleshooting

- **Error API Key:** Pastikan Anda memasukkan API key Gemini yang valid pada tab Pengaturan
- **Tidak Ada Konten yang Diambil:** Beberapa halaman web mungkin memiliki struktur yang tidak standar dan sulit untuk mengekstrak kontennya
- **Rate Limit Exceeded:** Jika Anda menerima error ini, Anda mungkin telah mencapai batas penggunaan API Gemini; Coba lagi nanti
- **Hasil Timeout:** Beberapa halaman mungkin memerlukan waktu lebih lama untuk diproses; Coba lagi dengan konten yang lebih pendek
- **Konteks Percakapan Hilang:** Jika konteks percakapan tampaknya hilang, klik "Clear Context" dan mulai percakapan baru
- **UI Tidak Responsif:** Coba refresh halaman atau restart browser jika UI tidak merespons

## Privasi / Privacy

- Semua konten halaman web dan riwayat disimpan secara lokal di perangkat Anda
- API key Anda hanya digunakan untuk permintaan ke API Gemini dan disimpan secara lokal
- Tidak ada data yang dikirim ke server pihak ketiga selain API Gemini

## Fitur Mendatang / Upcoming Features

- Dukungan untuk lebih banyak bahasa
- Integrasi dengan layanan cloud untuk sinkronisasi riwayat antar perangkat
- Opsi tambahan untuk menyesuaikan ringkasan (panjang, format)
- Tema khusus dan opsi penyesuaian UI
- Fitur berbagi sosial untuk ringkasan dan jawaban

## Lisensi / License

Page Resumer Pro dilisensikan di bawah [Lisensi MIT](LICENSE). Anda bebas menggunakan, memodifikasi, dan mendistribusikan kode ini sesuai dengan ketentuan lisensi tersebut.

Page Resumer Pro is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this code according to the terms of this license.

---

Page Resumer Pro dibuat untuk membantu Anda menghemat waktu dan meningkatkan pemahaman saat menjelajahi web. Jika Anda memiliki saran atau mengalami masalah, silakan buat issue di repositori ini.