'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Komponen Kartu Statistik (tidak berubah)
const StatCard = ({ title, value, unit }) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="mt-1 text-3xl font-semibold text-gray-900">
      {value} <span className="text-lg font-normal">{unit}</span>
    </p>
  </div>
);

// Komponen Skeleton (tidak berubah)
const DashboardSkeleton = () => (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 animate-pulse">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
          <div className="h-10 bg-gray-200 rounded w-24"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="h-28 bg-white p-6 rounded-lg shadow-md"></div>
        <div className="h-28 bg-white p-6 rounded-lg shadow-md"></div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
);

// --- KOMPONEN BARU UNTUK AKTIVITAS TERKINI ---
const RecentActivity = ({ transactions }) => {
    // Fungsi untuk format waktu relatif (misal: "5 menit yang lalu")
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " tahun lalu";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " bulan lalu";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " hari lalu";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " jam lalu";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " menit lalu";
        return "Baru saja";
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terkini</h2>
            <ul className="space-y-4">
                {transactions.length > 0 ? transactions.map(trx => (
                    <li key={trx.id} className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-900">{trx.plat_nomor}</p>
                            <p className="text-sm text-gray-500">{trx.liter} L</p>
                        </div>
                        <p className="text-sm text-gray-400">{timeAgo(trx.waktu_pencatatan)}</p>
                    </li>
                )) : (
                    <p className="text-gray-500">Belum ada aktivitas hari ini.</p>
                )}
            </ul>
        </div>
    );
};


export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ totalTransaksi: 0, totalLiter: 0 });
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('today');
  const [recentTransactions, setRecentTransactions] = useState([]); // State baru
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const now = new Date();
      let startDate;
      if (view === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else {
        startDate = new Date(now.setDate(now.getDate() - 6));
        startDate.setHours(0, 0, 0, 0);
      }

      // Ambil data utama untuk statistik dan grafik
      const { data, error } = await supabase
        .from('transaksi_pertalite')
        .select('id, liter, waktu_pencatatan, plat_nomor') // Tambah id dan plat_nomor
        .gte('waktu_pencatatan', startDate.toISOString())
        .order('waktu_pencatatan', { ascending: false }); // Urutkan dari terbaru

      if (error) {
        console.error("Error fetching data:", error);
      } else {
        // Ambil 5 data teratas untuk "Aktivitas Terkini"
        setRecentTransactions(data.slice(0, 5));
        
        const totalTransaksi = data.length;
        const totalLiter = data.reduce((sum, trx) => sum + trx.liter, 0);
        setStats({ totalTransaksi, totalLiter: totalLiter.toFixed(2) });

        if (view === 'today') {
          const hourlyData = Array(24).fill(0);
          data.forEach(trx => {
            const jam = new Date(trx.waktu_pencatatan).getHours();
            hourlyData[jam]++;
          });
          setChartData({
            labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
            datasets: [{
              label: 'Transaksi per Jam', data: hourlyData,
              // --- PENERAPAN GRADIENT WARNA ---
              backgroundColor: (context) => {
                  const ctx = context.chart.ctx;
                  if (!ctx) return 'rgba(59, 130, 246, 0.5)';
                  const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                  gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
                  gradient.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
                  return gradient;
              },
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
            }],
          });
        } else { // 'weekly'
          const dailyData = Array(7).fill(0);
          const dayLabels = [];
          const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dayLabels.push(days[d.getDay()]);
          }
          data.forEach(trx => {
            const transactionDate = new Date(trx.waktu_pencatatan);
            const diffDays = Math.floor((new Date() - transactionDate) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
              dailyData[6 - diffDays]++;
            }
          });
          setChartData({
            labels: dayLabels,
            datasets: [{
              label: 'Transaksi per Hari', data: dailyData,
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 1,
            }],
          });
        }
      }
      setIsLoading(false);
    };

    checkUserAndFetchData();
  }, [router, view]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (!user || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">
              Menampilkan data untuk: <span className="font-semibold">{view === 'today' ? 'Hari Ini' : '7 Hari Terakhir'}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link href="/riwayat" className="text-blue-500 hover:text-blue-700 font-bold">
              Lihat Riwayat &rarr;
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-2 mb-8">
            <button onClick={() => setView('today')} className={`px-4 py-2 rounded-md font-semibold ${view === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>
                Hari Ini
            </button>
            <button onClick={() => setView('weekly')} className={`px-4 py-2 rounded-md font-semibold ${view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}>
                7 Hari Terakhir
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard title="Total Transaksi" value={stats.totalTransaksi} unit="kendaraan" />
          <StatCard title="Total Liter Terjual" value={stats.totalLiter} unit="L" />
        </div>

        {/* --- LAYOUT BARU UNTUK GRAFIK DAN AKTIVITAS TERKINI --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {view === 'today' ? 'Aktivitas Transaksi per Jam' : 'Distribusi Transaksi Mingguan'}
              </h2>
              <Bar 
                options={{
                  responsive: true,
                  plugins: { legend: { position: 'top' }, title: { display: false } }
                }} 
                data={chartData} 
              />
            </div>
            <div className="lg:col-span-1">
                <RecentActivity transactions={recentTransactions} />
            </div>
        </div>

      </div>
    </div>
  );
}
