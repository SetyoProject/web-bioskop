# 🎬 CinemaKu

**Website Pemesanan Tiket Bioskop Berbasis Web**

## 📖 Deskripsi

CinemaKu merupakan aplikasi pemesanan tiket bioskop berbasis web yang dirancang untuk memudahkan pengguna dalam melakukan pemesanan tiket secara online. Pengguna dapat melihat daftar film yang sedang tayang, memilih jadwal dan kursi, memperoleh kode booking, serta menerima e-ticket dalam bentuk PDF melalui WhatsApp setelah pembayaran dikonfirmasi oleh admin.

Sistem ini juga dilengkapi dengan panel admin untuk mengelola transaksi, melakukan konfirmasi pembayaran, serta melakukan validasi tiket menggunakan QR Code Scanner.

---

## ✨ Fitur Utama

### 👤 Pengguna (Customer)

* Melihat daftar film yang sedang tayang (Now Playing)
* Mencari film berdasarkan judul
* Melihat detail film:

  * Genre
  * Durasi
  * Jadwal
  * Harga tiket
  * Jumlah kursi tersedia
* Memilih studio dan kursi
* Menambahkan tiket ke keranjang
* Mengisi data pemesanan
* Mendapatkan kode booking otomatis
* Menyalin kode booking (Copy Booking Code)
* Melakukan pembayaran secara offline di kasir bioskop
* Menerima e-ticket PDF dan QR Code melalui WhatsApp setelah pembayaran dikonfirmasi admin

---

### 👨‍💼 Admin

* Login admin
* Menambah data film baru beserta poster film
* Mengubah (update) informasi film
* Menghapus data film
* Melihat dashboard transaksi
* Mencari transaksi berdasarkan kode booking
* Mengonfirmasi pembayaran pelanggan
* Mengirim e-ticket PDF ke WhatsApp pelanggan
* Melihat status pembayaran
* Melihat status tiket
* Melakukan scan QR Code tiket
* Mengubah status tiket menjadi "Sudah Digunakan"
* Mencatat waktu scan tiket

---

## 🔄 Alur Sistem

### Pemesanan Tiket

Pelanggan memilih film
↓
Memilih studio dan kursi
↓
Menambahkan tiket ke keranjang
↓
Mengisi data pemesan
↓
Sistem membuat kode booking
↓
Pelanggan datang ke bioskop
↓
Melakukan pembayaran cash di kasir
↓
Admin mengonfirmasi pembayaran
↓
Sistem membuat e-ticket PDF
↓
E-ticket dan QR Code dikirim ke WhatsApp
↓
QR Code dipindai saat check-in

---

## 🖼️ Halaman Sistem

### Customer

* Beranda (Home)
* Daftar Film
* Keranjang (Checkout)
* Halaman Pemesanan Berhasil
* Halaman E-Ticket

### Admin

* Login Admin
* Dashboard
* Fitur CRUD Film
* Data Transaksi
* Scan Tiket

---

## 🛠️ Teknologi yang Digunakan

### Frontend

* HTML5
* CSS3
* JavaScript (Vanilla JS)

### Backend

* Node.js
* Express.js

### Library

* PDFKit
* QRCode
* Axios
* Html5Qrcode
* Fonnte API

##  Instalasi

### Clone Repository

```bash
git clone https://github.com/SetyoProject/web-bioskop.git
cd CinemaKu
```

### Install Dependencies

```bash
npm install
```

### Menjalankan Server

```bash
node server.js
```

atau

```bash
npm start
```

---

## 🌐 Akses Aplikasi

Customer:

```text
https://web-bioskop.onrender.com/
```

Admin:

```text
https://web-bioskop.onrender.com/panel-admin
```

---

## 📄 E-Ticket

E-ticket yang dihasilkan berisi:

* Logo CinemaKu
* QR Code
* Kode Booking
* Nama Pemesan
* Judul Film
* Studio
* Jadwal
* Nomor Kursi
* Total Pembayaran

---

## 📱 Integrasi WhatsApp

Setelah pembayaran dikonfirmasi admin:

1. Sistem membuat file PDF e-ticket.
2. Sistem mengirimkan pesan WhatsApp kepada pelanggan.
3. Pelanggan menerima e-ticket beserta QR Code untuk digunakan saat check-in.

---

## ⚠️ Catatan

Pada implementasi menggunakan Render Free Plan, data yang disimpan pada file JSON bersifat sementara (non-persistent). Oleh karena itu, data booking dan file yang diunggah dapat hilang ketika server melakukan restart atau redeploy.

Pada implementasi skala produksi, penyimpanan data sebaiknya menggunakan database seperti MongoDB atau PostgreSQL agar data tersimpan secara permanen.

---

## 👨‍💻 Pengembang

**CinemaKu**
Website Pemesanan Tiket Bioskop Berbasis Web

Dikembangkan sebagai proyek pembelajaran dan tugas akhir dalam implementasi aplikasi web menggunakan Node.js dan Express.js.
