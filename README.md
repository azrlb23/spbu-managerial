# SPBUManagerialV1 - Dokumentasi Lengkap Proyek

Aplikasi web minimalis untuk pencatatan transaksi bahan bakar Pertalite di SPBU. Dokumen ini berisi panduan lengkap dari setup awal, deployment, hingga pengujian dan pemeliharaan aplikasi.

---

## 🚀 Status Proyek: Versi 1.5 (Fitur Lanjutan)

Aplikasi telah berkembang dari MVP menjadi produk yang lebih matang dengan penambahan fitur keamanan, analisis data, dan peningkatan signifikan pada pengalaman pengguna (UX).

### ✨ Fitur yang Sudah Diimplementasikan

#### Fitur Operator (Halaman Utama)
-   **Pengecekan Plat Dahulu**: Alur kerja baru dimana plat nomor dicek terlebih dahulu sebelum menampilkan form input liter.
-   **Validasi Format Plat Nomor**: Menerapkan Regex untuk memastikan format plat nomor sesuai standar (contoh: KT 1234 ABC).
-   **Input Liter & Harga Otomatis**: Form untuk input jumlah liter dengan kalkulasi harga otomatis.
-   **Pencegahan Input Duplikat**: Logika untuk menolak input jika plat nomor yang sama sudah tercatat pada hari yang sama (reset jam 00:00).
-   **Peningkatan UX**:
    -   Keyboard numerik otomatis muncul di perangkat mobile untuk input liter.
    -   Fokus otomatis berpindah ke kolom liter setelah menekan "Enter" pada kolom plat.

#### Fitur Admin/Manajer (Dilindungi Login)
-   **Sistem Autentikasi**: Halaman `/login` khusus untuk admin/manajer menggunakan **Supabase Auth**.
-   **Dashboard Analitik (`/dashboard`)**:
    -   Menampilkan ringkasan data visual dengan filter "Hari Ini" dan "7 Hari Terakhir".
    -   Kartu statistik untuk "Total Transaksi" dan "Total Liter Terjual".
    -   Grafik batang interaktif untuk transaksi per jam (harian) atau per hari (mingguan).
    -   Panel "Aktivitas Terkini" yang menampilkan 5 transaksi terakhir.
-   **Halaman Riwayat Transaksi (`/riwayat`)**:
    -   Menampilkan data transaksi dengan sistem **paginasi** (20 data per halaman).
    -   Fungsi filter berdasarkan plat nomor dan tanggal.
    -   Fungsi **sorting** data pada setiap kolom tabel (naik/turun).
    -   Fitur **Ekspor ke CSV** untuk mengunduh data yang telah difilter.

#### Peningkatan Antarmuka & Pengalaman Pengguna (Global)
-   **Transisi Halaman Mulus**: Animasi geser yang halus antar halaman menggunakan `framer-motion` tanpa efek "kedip hitam".
-   **Skeleton UI**: Tampilan *loading* yang profesional di halaman Dashboard dan Riwayat.
-   **Desain Sepenuhnya Responsif**:
    -   Tabel riwayat berubah menjadi tumpukan kartu di layar mobile.
    -   Tombol paginasi menyesuaikan layout secara vertikal di layar mobile.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

-   **Framework:** [Next.js](https://nextjs.org/) (React)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Database & Autentikasi:** [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth)
-   **Grafik:** [Chart.js](https://www.chartjs.org/) dengan `react-chartjs-2`
-   **Animasi:** [Framer Motion](https://www.framer.com/motion/)
-   **Utilitas CSV:** [Papaparse](https://www.papaparse.com/)
-   **Hosting:** [Vercel](https://vercel.com/)

---

## ⚙️ 1. Setup Proyek & Pengembangan Lokal

### 1.1. Clone Repository
```bash
git clone [https://github.com/azrlb23/SPBUManagerial.git](https://github.com/azrlb23/SPBUManagerial.git)
cd spbu-managerial
```

### 1.2. Install Dependencies
```bash
npm install
```

### 1.3. Konfigurasi Database & Environment
1.  **Buat Tabel di Supabase**: Buka **SQL Editor** di Supabase, jalankan query berikut:
    ```sql
    CREATE TABLE transaksi_pertalite (
      id BIGSERIAL PRIMARY KEY,
      plat_nomor TEXT NOT NULL,
      liter NUMERIC(10, 2) NOT NULL,
      harga BIGINT NOT NULL,
      waktu_pencatatan TIMESTAMPTZ DEFAULT now() NOT NULL
    );
    ```
2.  **Setup Autentikasi**: Di dasbor Supabase, pergi ke **Authentication > Providers** dan pastikan **Email** aktif. Kemudian di tab **Users**, klik **"Add user"** untuk membuat akun admin/manajer.
3.  **Setup Environment Variables**: Buat file `.env.local` dan isi dengan kredensial Supabase Anda:
    ```
    NEXT_PUBLIC_SUPABASE_URL=URL_PROYEK_ANDA
    NEXT_PUBLIC_SUPABASE_ANON_KEY=KUNCI_ANON_PUBLIC_ANDA
    ```

### 1.4. Jalankan Aplikasi Lokal
```bash
npm run dev
```
Buka **http://localhost:3000** di browser Anda.

---

## 🚀 2. Deployment ke Vercel

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
2.  **Environment Variables**: Buka bagian **"Environment Variables"**. Tambahkan dua variabel yang sama persis seperti di file `.env.local` Anda.
3.  **Deploy**: Klik tombol **"Deploy"**. Tunggu proses selesai.

---

## 🛠️ 3. Manajemen & Pemeliharaan

### 3.1. Troubleshooting: "Invalid API Key"
Jika Anda melihat error ini setelah deploy, itu berarti Anda lupa menambahkan Environment Variables di Vercel.
1.  Buka dasbor proyek Anda di Vercel.
2.  Klik tab **"Settings" > "Environment Variables"**.
3.  Tambahkan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4.  Pergi ke tab **"Deployments"**, cari deployment terbaru, klik menu `...` dan pilih **"Redeploy"**.

### 3.2. Memperbarui Aplikasi
Setiap kali Anda ingin memperbarui aplikasi, cukup lakukan `git push` ke GitHub. Vercel akan otomatis melakukan *redeployment*.

### 3.3. Membersihkan Data Uji Coba
Buka **SQL Editor** di Supabase dan jalankan perintah:
```sql
TRUNCATE TABLE transaksi_pertalite RESTART IDENTITY;
```
**Peringatan:** Tindakan ini tidak bisa dibatalkan.

---

## ✅ 4. Panduan Pengujian Fungsionalitas

-   **[ ] Test 1: Alur Kerja Operator**
    1.  Buka halaman utama. Masukkan plat nomor dengan format salah (misal: "AZRIEL"), klik "Cek". **Hasil:** Muncul error format tidak valid.
    2.  Masukkan plat nomor valid, klik "Cek". **Hasil:** Muncul notifikasi "Boleh Mengisi" dan form liter muncul.
    3.  Masukkan jumlah liter, klik "Simpan". **Hasil:** Muncul notifikasi sukses, form di-reset ke awal.
    4.  Masukkan plat yang sama lagi, klik "Cek". **Hasil:** Muncul error "Sudah mengisi hari ini".

-   **[ ] Test 2: Alur Kerja Admin**
    1.  Dari halaman utama, klik link "Login Admin".
    2.  Coba login dengan password salah. **Hasil:** Muncul notifikasi error.
    3.  Login dengan email dan password yang benar. **Hasil:** Berhasil diarahkan ke halaman Dashboard.

-   **[ ] Test 3: Fungsionalitas Dashboard**
    1.  Pastikan kartu statistik dan grafik menampilkan data.
    2.  Klik filter "7 Hari Terakhir". **Hasil:** Angka dan grafik berubah sesuai rentang waktu.
    3.  Pastikan panel "Aktivitas Terkini" menampilkan 5 data terakhir.
    4.  Klik "Lihat Riwayat". **Hasil:** Berpindah ke halaman riwayat dengan transisi geser.

-   **[ ] Test 4: Fungsionalitas Halaman Riwayat**
    1.  Gunakan filter plat dan tanggal, lalu klik "Bersihkan". **Hasil:** Filter terhapus, data kembali normal.
    2.  Klik judul kolom untuk sorting. **Hasil:** Data terurut dengan benar.
    3.  Klik tombol "Ekspor ke CSV". **Hasil:** File `.csv` berisi data yang terfilter berhasil diunduh.

-   **[ ] Test 5: Desain Responsif & Transisi**
    1.  Buka Developer Tools (`F12`) dan aktifkan mode perangkat mobile.
    2.  Navigasi antar semua halaman. **Hasil:** Transisi geser berjalan mulus tanpa kedip hitam.
    3.  Periksa halaman riwayat. **Hasil:** Tabel menjadi kartu, paginasi tersusun vertikal.
