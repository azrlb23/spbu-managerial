# SPBUManagerialV1 - Dokumentasi Lengkap Proyek

Aplikasi web minimalis untuk pencatatan transaksi bahan bakar Pertalite di SPBU. Dokumen ini berisi panduan lengkap dari setup awal, deployment, hingga pengujian dan pemeliharaan aplikasi.

---

### Daftar Isi
1.  [Setup Proyek & Pengembangan Lokal](#-1-setup-proyek--pengembangan-lokal)
2.  [Deployment ke Vercel](#-2-deployment-ke-vercel)
3.  [Manajemen & Pemeliharaan](#-3-manajemen--pemeliharaan)
4.  [Panduan Pengujian Fungsionalitas](#-4-panduan-pengujian-fungsionalitas)

---

## ⚙️ 1. Setup Proyek & Pengembangan Lokal

Langkah-langkah untuk menjalankan aplikasi di komputer lokal.

### 1.1. Clone Repository
Buka terminal dan jalankan perintah berikut:
```bash
git clone [https://github.com/azrlb23/SPBUManagerial.git](https://github.com/azrlb23/SPBUManagerial.git)
cd spbu-managerial
```

### 1.2. Install Dependencies
Install semua paket yang dibutuhkan oleh proyek:
```bash
npm install
```

### 1.3. Konfigurasi Database & Environment
Aplikasi ini terhubung ke database Supabase.
1.  **Buat Tabel di Supabase**: Buka Supabase, masuk ke **SQL Editor**, dan jalankan query berikut untuk membuat tabel yang dibutuhkan:
    ```sql
    CREATE TABLE transaksi_pertalite (
      id BIGSERIAL PRIMARY KEY,
      plat_nomor TEXT NOT NULL,
      liter NUMERIC(10, 2) NOT NULL,
      harga BIGINT NOT NULL,
      waktu_pencatatan TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    ```
2.  **Setup Environment Variables**: Buat file bernama `.env.local` di direktori utama proyek. Isi file tersebut dengan kredensial Supabase Anda:
    ```
    NEXT_PUBLIC_SUPABASE_URL=URL_PROYEK_ANDA_DARI_SUPABASE
    NEXT_PUBLIC_SUPABASE_ANON_KEY=KUNCI_ANON_PUBLIC_ANDA_DARI_SUPABASE
    ```
    Anda bisa menemukan URL dan Kunci di dasbor Supabase pada bagian **Project Settings > API**.

### 1.4. Jalankan Aplikasi Lokal
Setelah semua setup selesai, jalankan server pengembangan:
```bash
npm run dev
```
Buka **http://localhost:3000** di browser Anda untuk melihat aplikasi.

---

## 🚀 2. Deployment ke Vercel

Langkah-langkah untuk mempublikasikan aplikasi agar bisa diakses secara online.

### 2.1. Simpan Kode ke GitHub
Pastikan semua perubahan terbaru sudah diunggah ke GitHub:
```bash
git add .
git commit -m "Menyiapkan untuk deployment"
git push origin main
```

### 2.2. Import Proyek ke Vercel
1.  Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub Anda.
2.  Klik **"Add New..." > "Project"**.
3.  Cari repository `spbu-managerial` dan klik **"Import"**.

### 2.3. Konfigurasi & Deploy
1.  **Framework Preset**: Vercel akan otomatis mendeteksi **Next.js**. Biarkan pengaturan default.
2.  **Environment Variables**: Buka bagian **"Environment Variables"**. Ini adalah langkah paling penting. Tambahkan dua variabel yang sama persis seperti di file `.env.local` Anda.
3.  **Deploy**: Klik tombol **"Deploy"**. Tunggu proses selesai, dan Vercel akan memberikan URL publik untuk aplikasi Anda.

---

## 🛠️ 3. Manajemen & Pemeliharaan

Tugas yang perlu dilakukan setelah aplikasi *live*.

### 3.1. Troubleshooting: "Invalid API Key"
Jika Anda melihat error ini setelah deploy, itu berarti Anda lupa menambahkan Environment Variables.
1.  Buka dasbor proyek Anda di Vercel.
2.  Klik tab **"Settings" > "Environment Variables"**.
3.  Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4.  Pergi ke tab **"Deployments"**, cari deployment terbaru, klik menu `...` dan pilih **"Redeploy"**.

### 3.2. Memperbarui Aplikasi
Setiap kali Anda ingin memperbarui aplikasi:
1.  Lakukan perubahan pada kode di komputer lokal Anda.
2.  Unggah perubahan tersebut ke GitHub dengan `git push`.
3.  Vercel akan secara otomatis mendeteksi `push` tersebut dan memulai proses *redeployment* baru.

### 3.3. Membersihkan Data Uji Coba
Untuk menghapus semua data dari tabel sebelum digunakan secara resmi:
1.  Buka **SQL Editor** di Supabase.
2.  Jalankan perintah berikut:
    ```sql
    TRUNCATE TABLE transaksi_pertalite RESTART IDENTITY;
    ```
    Perintah ini akan mengosongkan tabel dan me-reset ID kembali ke 1. **Tindakan ini tidak bisa dibatalkan.**

---

## ✅ 4. Panduan Pengujian Fungsionalitas

Checklist untuk memastikan semua fitur berjalan dengan baik.

-   **[ ] Test 1: Input Data Valid**
    1.  Buka halaman utama.
    2.  Masukkan plat nomor dan jumlah liter yang valid.
    3.  Klik "Simpan Transaksi".
    4.  **Hasil yang Diharapkan**: Muncul notifikasi "Data berhasil disimpan!" dan form menjadi kosong.

-   **[ ] Test 2: Input Duplikat**
    1.  Masukkan plat nomor yang sama seperti pada Test 1.
    2.  Klik "Simpan Transaksi".
    3.  **Hasil yang Diharapkan**: Muncul notifikasi error "Plat nomor ... sudah mengisi hari ini." dan notifikasi tersebut hilang setelah beberapa detik.

-   **[ ] Test 3: Halaman Riwayat & Paginasi**
    1.  Klik link "Lihat Riwayat Transaksi".
    2.  **Hasil yang Diharapkan**: Halaman riwayat terbuka, menampilkan data yang baru saja diinput. Tombol "Sebelumnya" nonaktif, dan tombol "Berikutnya" aktif jika data lebih dari 20.

-   **[ ] Test 4: Filter & Tombol Bersihkan**
    1.  Di halaman riwayat, ketik sebagian plat nomor di kolom pencarian.
    2.  **Hasil yang Diharapkan**: Tabel hanya menampilkan data yang cocok.
    3.  Klik tombol "Bersihkan".
    4.  **Hasil yang Diharapkan**: Filter terhapus dan tabel menampilkan semua data kembali.

-   **[ ] Test 5: Sorting Tabel**
    1.  Di halaman riwayat, klik pada judul kolom (misal: "Plat Nomor").
    2.  **Hasil yang Diharapkan**: Data diurutkan berdasarkan kolom tersebut (A-Z). Ikon panah muncul.
    3.  Klik lagi pada judul kolom yang sama.
    4.  **Hasil yang Diharapkan**: Urutan data terbalik (Z-A).

-   **[ ] Test 6: Desain Responsif**
    1.  Buka Developer Tools di browser (`F12`).
    2.  Aktifkan mode perangkat (ikon HP/tablet).
    3.  Pilih ukuran layar "iPhone 12 Pro" atau sejenisnya.
    4.  **Hasil yang Diharapkan (Halaman Input)**: Form terlihat rapi dan tidak ada yang terpotong.
    5.  **Hasil yang Diharapkan (Halaman Riwayat)**: Tabel berubah menjadi tumpukan kartu. Tombol paginasi tersusun secara vertikal (atas-bawah).