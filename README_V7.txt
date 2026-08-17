RINCIAN PEMESANAN — PWA V7

PERBAIKAN UTAMA:
1. Memperbaiki error sintaks JavaScript pada halaman Resest yang membuat event klik dapat gagal dijalankan.
2. Klik seluruh kartu produk sekarang memasukkan produk ke Keranjang Penjualan.
3. Tombol + pada kartu produk juga memasukkan produk ke keranjang.
4. Menambahkan event-delegation sebagai pengaman untuk klik kartu produk.
5. Service Worker dinaikkan ke cache v7 agar browser tidak terus memakai JavaScript lama.

UPLOAD KE GITHUB:
- Ganti file index.html
- Ganti file style.css
- Ganti file script.js
- Ganti file service-worker.js
- Ganti manifest.webmanifest
- Ganti icon-192.png
- Ganti icon-512.png

Setelah commit:
https://seindonesiaku.github.io/rincian-pemesanan/?v=7

Jika masih melihat versi lama:
1. Tutup tab aplikasi.
2. Buka URL ?v=7 di atas.
3. Refresh.
4. Jika pernah memasang PWA, hapus ikon aplikasi lama lalu pasang kembali.

Catatan: Jangan membuat folder icons. Semua file ikon tetap di root repository.
