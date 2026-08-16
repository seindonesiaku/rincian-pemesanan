RINCIAN PEMESANAN — PWA

Isi:
- index.html
- style.css
- script.js
- manifest.webmanifest
- service-worker.js
- icons/icon-192.png
- icons/icon-512.png

Cara menjalankan:
1. Untuk pengujian lokal, jalankan melalui localhost/127.0.0.1.
2. Untuk memasang sebagai aplikasi PWA tanpa Termux, upload folder ini ke hosting HTTPS
   (contoh: GitHub Pages atau hosting web lain).
3. Buka alamat HTTPS tersebut di browser yang mendukung PWA.
4. Pilih "Install app"/"Tambahkan ke layar utama".
5. Setelah terpasang, aplikasi dapat dibuka dari ikon seperti aplikasi biasa.

Catatan:
- Service worker membutuhkan secure context (HTTPS) untuk deployment normal.
- localhost/127.0.0.1 dapat dipakai untuk pengembangan.
- PWA ini menggunakan cache aplikasi agar shell aplikasi tetap tersedia ketika offline.
