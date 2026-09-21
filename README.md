# 🎲 Ular Tangga MBG (Makan Bergizi Gratis)

Sebuah aplikasi game edukasi interaktif berbasis web yang modern, _colorful_, dan menyenangkan. Game ini dirancang khusus untuk mengedukasi anak-anak hingga remaja mengenai pentingnya makanan bergizi, gizi seimbang, dan pola hidup sehat melalui konsep permainan klasik Ular Tangga.

---

## ✨ Fitur Utama

- **🎨 UI/UX Modern:** Desain responsif dengan warna cerah yang ramah anak, dibuat menggunakan Tailwind CSS.
- **🤖 Mode Lokal:** Bermain sendiri melawan Komputer (Bot) atau bersama teman di satu layar (hingga 4 pemain).
- **🌐 Mode Online (Mabar):** Bermain secara _real-time_ dengan teman di perangkat/jaringan berbeda berkat integrasi Firebase Firestore.
- **❓ Edukasi Gizi Interaktif:** 50+ pertanyaan pilihan ganda dan kotak bonus/tantangan seputar gizi seimbang.
- **🎵 Audio Sintesis:** Efek suara dan musik ceria dibuat menggunakan Web Audio API murni (tanpa perlu _download_ aset MP3 tambahan).
- **⚡ Single File Architecture:** Seluruh logika HTML, CSS, dan JavaScript berada dalam satu file yang mudah dipelajari dan dikembangkan.

---

## 🚀 Cara Menjalankan Game di Komputer (Lokal)

Karena game ini menggunakan _ES Modules_ (`<script type="module">`), Anda tidak bisa sekadar melakukan klik dua kali (double-click) pada file `index.html`. Anda memerlukan _local web server_.

**1. Clone Repository ini:**

```bash
git clone [https://github.com/username-anda/ular-tangga-mbg.git](https://github.com/username-anda/ular-tangga-mbg.git)
cd ular-tangga-mbg
2. Gunakan salah satu cara berikut untuk menjalankan server lokal:

Cara 1: Menggunakan VS Code (Disarankan)
Install ekstensi Live Server, lalu klik kanan pada file index.html dan pilih "Open with Live Server".

Cara 2: Menggunakan Python (Bawaan Mac/Linux)

Bash
python3 -m http.server 8000
Lalu buka browser dan akses http://localhost:8000.

Cara 3: Menggunakan Node.js / HTTP-Server

Bash
npx http-server .
🌐 Cara Setting Multiplayer Online (Firebase)
Agar fitur "Buat Ruangan Baru" dan "Gabung" (Mabar beda HP/Laptop) berfungsi, Anda wajib menghubungkan game ini ke database Firebase milik Anda sendiri (Gratis!).

Langkah 1: Buat Project Firebase
Buka Firebase Console dan login menggunakan akun Google.

Klik Add Project, beri nama project (misal: ular-tangga-mabar), lalu klik Create.

Di halaman utama project, klik ikon </> (Web) untuk mendaftarkan aplikasi Anda.

Anda akan mendapatkan blok kode const firebaseConfig = { ... }. Copy kode tersebut.

Langkah 2: Aktifkan Firestore Database
Di menu sebelah kiri Firebase, pilih Firestore Database, lalu klik Create database.

Pilih lokasi server terdekat (misal: asia-southeast2 untuk Jakarta).

SANGAT PENTING: Pilih Start in test mode, lalu klik Enable.

Langkah 3: Aktifkan Login Anonim
Di menu sebelah kiri, pilih Authentication, lalu klik Get Started.

Masuk ke tab Sign-in method.

Scroll ke bawah, temukan opsi Anonymous (Anonim).

Aktifkan (Enable) toggle-nya, lalu klik Save.

Langkah 4: Pasang Config ke Game Anda
Buka file index.html menggunakan Code Editor Anda, scroll ke bagian bawah program, lalu timpa firebaseConfig bawaan dengan konfigurasi milik Anda:

JavaScript
const firebaseConfig = {
    apiKey: "API_KEY_ANDA",
    authDomain: "PROJECT_ANDA.firebaseapp.com",
    projectId: "PROJECT_ANDA",
    storageBucket: "PROJECT_ANDA.firebasestorage.app",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdefghij"
};
Simpan file, dan sekarang fitur Online Mabar sudah siap digunakan 100%!

🌍 Cara Hosting Game ke Internet (Gratis)
Agar teman Anda bisa mengakses game ini melalui link, Anda bisa menggunakan layanan hosting gratis seperti Vercel atau GitHub Pages.

Menggunakan Vercel (Paling Mudah):

Pastikan Anda sudah menginstal Node.js.

Buka terminal di folder project Anda, lalu jalankan:

Bash
npm install -g vercel
vercel
Ikuti instruksi di layar (cukup tekan Enter pada setiap pertanyaan untuk menggunakan pengaturan default).

Vercel akan memberikan Link URL publik untuk game Anda. Bagikan link tersebut ke teman-teman Anda!

🛠️ Tech Stack
HTML5 & SVG (Untuk rendering papan dan ular tangga yang tajam di layar apa pun)

Tailwind CSS (Styling via CDN)

Vanilla JavaScript (ES6)

Firebase v11 (Firestore & Auth)

🤝 Berkontribusi
Project ini bersifat Open-Source. Jika Anda ingin menambahkan pertanyaan edukasi baru, memperbaiki bug, atau menambahkan fitur baru, silakan lakukan Fork repository ini dan buat Pull Request.

📝 Lisensi
Dibuat untuk tujuan edukasi. Jangan ragu untuk memodifikasi dan menggunakannya untuk tugas sekolah, bahan ajar guru, atau proyek pribadi Anda.
```
