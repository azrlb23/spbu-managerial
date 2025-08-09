# SPBUManagerialV1

Aplikasi web minimalis untuk pencatatan transaksi bahan bakar Pertalite di SPBU. Aplikasi ini dirancang untuk kecepatan, kemudahan penggunaan, dan untuk menyediakan data yang dapat diaudit oleh manajemen.

---

## 🚀 Status Proyek: Versi 1.0 (Fungsional)

Aplikasi saat ini sudah fungsional dan memiliki fitur-fitur inti yang dibutuhkan untuk operasional harian.

### ✨ Fitur yang Sudah Diimplementasikan

-   **Halaman Pencatatan Transaksi:**
    -   Input untuk Plat Nomor Kendaraan.
    -   Input untuk Jumlah Liter.
    -   Kalkulasi harga otomatis berdasarkan harga per liter (Rp 10.000).
    -   Tombol "Simpan" untuk mengirim data ke database.
    -   Notifikasi sukses atau gagal setelah penyimpanan.

-   **Halaman Riwayat Transaksi:**
    -   Menampilkan seluruh riwayat transaksi dalam bentuk tabel, diurutkan dari yang terbaru.
    -   Fungsi filter untuk mencari transaksi berdasarkan Plat Nomor.
    -   Fungsi filter untuk menampilkan transaksi pada Tanggal tertentu.

-   **Logika Bisnis & Keamanan:**
    -   **Pencegahan Input Duplikat:** Aplikasi secara otomatis menolak input jika plat nomor yang sama sudah tercatat pada hari yang sama (reset setiap jam 00:00).
    -   **Koneksi Aman:** Seluruh data yang dikirim ke database sudah terhubung dengan aman.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

-   **Framework:** [Next.js](https://nextjs.org/) (React)
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Database:** [Supabase](https://supabase.com/) (PostgreSQL)
-   **Hosting:** [Vercel](https://vercel.com/) (direncanakan)

---

## ⚙️ Cara Menjalankan Proyek Secara Lokal

1.  **Clone Repository**
    ```bash
    git clone [https://github.com/azrlb23/SPBUManagerial.git](https://github.com/azrlb23/SPBUManagerial.git)
    cd spbu-managerial
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**
    -   Buat file `.env.local` di direktori utama.
    -   Isi file tersebut dengan kredensial Supabase Anda:
        ```
        NEXT_PUBLIC_SUPABASE_URL=URL_PROYEK_ANDA
        NEXT_PUBLIC_SUPABASE_ANON_KEY=KUNCI_ANON_PUBLIC_ANDA
        ```

4.  **Jalankan Aplikasi**
    ```bash
    npm run dev
    ```
    Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🔮 Langkah Selanjutnya (Rencana)

-   Deployment proyek ke Vercel agar bisa diakses secara online.
-   Menambahkan fitur *loading state* yang lebih baik pada tabel riwayat.
-   Refactoring kode untuk meningkatkan kebersihan dan keterbacaan.
-   (Opsional V2) Menambahkan sistem autentikasi untuk Admin/Manajer.
