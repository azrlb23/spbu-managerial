# SPBUManagerialV2 - Dokumentasi Proyek

**SPBUManagerialV2** adalah aplikasi web komprehensif yang dirancang untuk pencatatan transaksi bahan bakar di SPBU, kini dengan sistem multi-pengguna berbasis peran, dasbor analitik yang kaya, dan sistem pencatatan log untuk keamanan dan audit.

---

## 🚀 Status Proyek: Versi 2.0 (Comprehensive Analytics & Role-Based Access)

Aplikasi telah berevolusi menjadi platform manajemen yang matang dengan arsitektur multi-pengguna, dasbor analitik terpusat, dan fungsionalitas laporan yang kuat untuk mendukung pengambilan keputusan bisnis.

### ✨ Fitur Utama yang Telah Diimplementasikan

#### Sistem Global & Keamanan
- **Sistem Login Berbasis Peran**: Aplikasi kini mewajibkan login. Tampilan dan hak akses secara otomatis disesuaikan berdasarkan peran pengguna (**Manajer** atau **Operator**).
- **Kontrol Akses (RLS)**: Menggunakan *Row Level Security* Supabase secara ekstensif untuk memastikan operator hanya bisa mengakses data yang diizinkan, sementara manajer memiliki akses penuh.
- **Pencatatan Log Aktivitas**: Setiap aksi penting (login, logout, pembuatan transaksi, ekspor data, upaya akses ditolak) secara otomatis dicatat dalam tabel `activity_logs` untuk audit dan keamanan.

#### Fitur untuk Operator
- **Alur Kerja Efisien**: Operator memilih jenis kendaraan (**Mobil/Motor**), lalu melanjutkan ke alur pengecekan plat dan input liter yang sudah divalidasi.
- **Deteksi Shift Otomatis**: Sistem secara otomatis mendeteksi dan menyimpan shift kerja (Shift 1 atau 2) berdasarkan jam transaksi.
- **Riwayat Harian Terpusat**: Operator dapat mengakses halaman riwayat khusus yang menampilkan **semua transaksi dari semua operator** pada hari itu, lengkap dengan fitur pencarian dan paginasi.
- **Peningkatan UX**: Notifikasi *toast* modern (`react-hot-toast`) dan animasi transisi (`framer-motion`) digunakan di seluruh alur kerja operator untuk pengalaman yang lebih baik.

#### Fitur untuk Manajer
- **Dashboard Analitik Komprehensif**: Halaman dasbor utama kini menjadi pusat analitik terpusat.
    - **Filter Rentang Waktu**: Manajer dapat dengan mudah beralih tampilan data antara **"Hari Ini", "7 Hari", "30 Hari",** dan **"Semua"**.
    - **Kartu Statistik Dinamis**: Menampilkan metrik kunci seperti Total Transaksi, Total Liter, Pendapatan Kotor, Rata-rata per Transaksi, dan Plat Paling Sering untuk rentang waktu yang dipilih.
    - **Visualisasi Data**: Grafik pai untuk distribusi **Jenis Kendaraan** dan **Shift**.
    - **Leaderboards**: Papan peringkat untuk **Top 5 Operator** (berdasarkan total liter) dan **Top 5 Pelanggan** (berdasarkan frekuensi pengisian).
- **Riwayat Transaksi Lanjutan**: Halaman riwayat kini memiliki filter lengkap berdasarkan Plat, Tanggal, **Shift, Operator,** dan **Jenis Kendaraan**.
- **Halaman Laporan Khusus**: Manajer dapat membuat laporan ringkasan performa untuk rentang tanggal kustom, menampilkan statistik utama dan detail transaksi.

---

## 🛠️ Tumpukan Teknologi (Tech Stack)

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database & Autentikasi:** [Supabase](https://supabase.com/) (PostgreSQL & Supabase Auth)
- **Grafik:** [Chart.js](https://www.chartjs.org/) dengan `react-chartjs-2`
- **Animasi:** [Framer Motion](https://www.framer.com/motion/)
- **Notifikasi:** [React Hot Toast](https://react-hot-toast.com/)
- **Utilitas CSV:** [Papaparse](https://www.papaparse.com/)
- **Hosting:** [Vercel](https://vercel.com/)

---

## ⚙️ 1. Setup Proyek & Pengembangan Lokal

### 1.1. Clone & Install
```bash
git clone [URL_REPOSITORY_ANDA]
cd spbu-managerial
npm install
```

### 1.2. Konfigurasi Database & Environment
Proyek ini memerlukan setup database yang spesifik.

1.  **Setup Environment Variables**: Buat file `.env.local` dan isi dengan kredensial Supabase Anda:
    ```
    NEXT_PUBLIC_SUPABASE_URL=URL_PROYEK_ANDA
    NEXT_PUBLIC_SUPABASE_ANON_KEY=KUNCI_ANON_PUBLIC_ANDA
    ```
2.  **Jalankan SQL Setup**: Buka **SQL Editor** di dasbor Supabase Anda dan jalankan **semua query** di bawah ini secara berurutan. Ini akan membuat tabel, relasi, fungsi, dan kebijakan keamanan yang diperlukan.

    ```sql
    -- 1. BUAT TABEL UNTUK PERAN PENGGUNA
    CREATE TABLE public.user_roles (
      user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL
    );

    -- 2. BUAT TABEL UTAMA UNTUK TRANSAKSI (DENGAN KOLOM BARU)
    CREATE TABLE public.transaksi_pertalite (
      id BIGSERIAL PRIMARY KEY,
      plat_nomor TEXT NOT NULL,
      liter NUMERIC(10, 2) NOT NULL,
      harga BIGINT NOT NULL,
      waktu_pencatatan TIMESTAMPTZ DEFAULT now() NOT NULL,
      operator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      operator_email TEXT,
      shift INT,
      jenis_kendaraan TEXT
    );

    -- 3. BUAT TABEL UNTUK LOG AKTIVITAS
    CREATE TABLE public.activity_logs (
      id BIGSERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
      user_email TEXT,
      action TEXT NOT NULL,
      details JSONB
    );

    -- 4. BUAT FUNGSI DATABASE
    -- Fungsi untuk mendapatkan peran pengguna
    CREATE OR REPLACE FUNCTION get_user_role()
    RETURNS TEXT AS $$
    DECLARE
      user_role TEXT;
    BEGIN
      SELECT role INTO user_role FROM public.user_roles WHERE user_id = auth.uid();
      RETURN user_role;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Fungsi untuk deteksi shift otomatis (Zona Waktu: WITA)
    CREATE OR REPLACE FUNCTION get_current_shift()
    RETURNS INT AS $$
    DECLARE
      current_hour INT;
    BEGIN
      current_hour := EXTRACT(HOUR FROM (now() AT TIME ZONE 'Asia/Makassar'));
      IF current_hour >= 7 AND current_hour < 13 THEN RETURN 1;
      ELSIF current_hour >= 13 AND current_hour < 23 THEN RETURN 2;
      ELSE RETURN 0;
      END IF;
    END;
    $$ LANGUAGE plpgsql;

    -- Fungsi untuk trigger
    CREATE OR REPLACE FUNCTION set_shift_on_insert()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.shift = get_current_shift();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 5. PASANG TRIGGER
    CREATE TRIGGER before_insert_set_shift
    BEFORE INSERT ON transaksi_pertalite
    FOR EACH ROW
    EXECUTE FUNCTION set_shift_on_insert();

    -- 6. AKTIFKAN ROW LEVEL SECURITY (RLS)
    ALTER TABLE public.transaksi_pertalite ENABLE ROW LEVEL SECURITY;

    -- 7. BUAT KEBIJAKAN (POLICIES) RLS
    -- Manajer bisa melihat semua data
    CREATE POLICY "Manajer can view all transactions"
    ON public.transaksi_pertalite FOR SELECT
    USING ((SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'manajer');

    -- Operator bisa menambah data baru
    CREATE POLICY "Operator can insert transactions"
    ON public.transaksi_pertalite FOR INSERT
    WITH CHECK ((SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'operator');

    -- Operator bisa melihat semua data HARI INI
    CREATE POLICY "Operator can view today's transactions"
    ON public.transaksi_pertalite FOR SELECT
    USING ((SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'operator' AND waktu_pencatatan >= date_trunc('day', now()));
    ```

3.  **Setup Pengguna & Peran**:
    * Di dasbor Supabase, pergi ke **Authentication > Users** untuk membuat akun Manajer dan Operator.
    * Dapatkan `ID` dari setiap pengguna, lalu jalankan query berikut di **SQL Editor** untuk menetapkan peran mereka:
        ```sql
        -- Ganti 'user_id_manajer' dan 'user_id_operator' dengan ID yang sebenarnya
        INSERT INTO public.user_roles (user_id, role) VALUES
        ('user_id_manajer', 'manajer'),
        ('user_id_operator', 'operator');
        ```

### 1.3. Jalankan Aplikasi Lokal
```bash
npm run dev
```
Buka **http://localhost:3000**. Aplikasi akan mengarahkan Anda ke halaman login.

---

## ✅ 2. Panduan Pengujian Fungsionalitas (V2)

- **[ ] Test 1: Alur Login & Akses**
    1. Coba akses `/dashboard` atau `/operator` tanpa login. **Hasil:** Harus diarahkan ke halaman login (`/`).
    2. Login sebagai **Operator**. **Hasil:** Diarahkan ke `/operator`.
    3. Coba akses `/dashboard` sebagai Operator. **Hasil:** Akses ditolak dan di-logout.
    4. Login sebagai **Manajer**. **Hasil:** Diarahkan ke `/dashboard`.

- **[ ] Test 2: Fungsionalitas Operator**
    1. Lakukan input transaksi lengkap (pilih jenis, cek plat valid, isi liter, simpan). **Hasil:** Notifikasi *toast* sukses, form kembali ke awal.
    2. Cek plat yang sama lagi. **Hasil:** Notifikasi *toast* error "sudah mengisi".
    3. Buka halaman riwayat operator. **Hasil:** Data yang baru saja diinput muncul.

- **[ ] Test 3: Fungsionalitas Manajer**
    1. Buka halaman Dashboard. Ganti filter waktu (Hari Ini, 7 Hari, dll.). **Hasil:** Semua kartu statistik dan grafik berubah sesuai filter.
    2. Buka halaman Riwayat. Coba semua filter (Plat, Tanggal, Shift, Operator, Jenis). **Hasil:** Data terfilter dengan benar.
    3. Ekspor data ke CSV. **Hasil:** File terunduh dengan data yang terfilter.
    4. Buka halaman Laporan. Buat laporan untuk rentang tanggal kustom. **Hasil:** Ringkasan dan detail transaksi ditampilkan dengan benar.
