'use client';

import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

// Komponen Kartu Statistik (diperbarui untuk teks lebih adaptif)
const StatCard = ({ title, value, unit, smallText = false }) => (
  <div className="bg-white p-6 rounded-lg shadow-md text-center h-full flex flex-col justify-center">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    <p className={`mt-1 font-semibold text-gray-900 ${smallText ? 'text-xl md:text-2xl' : 'text-3xl'}`}>
      {value} {unit && <span className="text-lg font-normal">{unit}</span>}
    </p>
  </div>
);

// Komponen Skeleton (dari kode asli Anda, tidak berubah)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="h-28 bg-white p-6 rounded-lg shadow-md"></div>
        <div className="h-28 bg-white p-6 rounded-lg shadow-md"></div>
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

// Komponen Aktivitas Terkini (dari kode asli Anda, tidak berubah)
const RecentActivity = ({ transactions }) => {
    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        let interval = seconds / 31536000; if (interval > 1) return Math.floor(interval) + " tahun lalu";
        interval = seconds / 2592000; if (interval > 1) return Math.floor(interval) + " bulan lalu";
        interval = seconds / 86400; if (interval > 1) return Math.floor(interval) + " hari lalu";
        interval = seconds / 3600; if (interval > 1) return Math.floor(interval) + " jam lalu";
        interval = seconds / 60; if (interval > 1) return Math.floor(interval) + " menit lalu";
        return "Baru saja";
    };
    return (
        <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Aktivitas Terkini</h2>
            <ul className="space-y-4">
                {transactions.length > 0 ? transactions.slice(0, 5).map(trx => (
                    <li key={trx.id} className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold text-gray-900">{trx.plat_nomor}</p>
                            <p className="text-sm text-gray-500">{trx.liter} L</p>
                        </div>
                        <p className="text-sm text-gray-400">{timeAgo(trx.waktu_pencatatan)}</p>
                    </li>
                )) : ( <p className="text-gray-500">Belum ada aktivitas.</p> )}
            </ul>
        </div>
    );
};

// --- KOMPONEN BARU: LEADERBOARDS ---
const Leaderboard = ({ title, data, valueKey, labelKey, unit = '' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
        <ul className="space-y-3">
            {data.length > 0 ? data.map((item, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                    <p className="font-medium text-gray-700 truncate w-2/3">{index + 1}. {item[labelKey]}</p>
                    <p className="font-bold text-gray-900">{item[valueKey].toLocaleString('id-ID')} {unit}</p>
                </li>
            )) : <p className="text-gray-500 text-sm">Tidak ada data.</p>}
        </ul>
    </div>
);


export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('today'); // State untuk kontrol tampilan
  const router = useRouter();

  // State untuk menyimpan semua transaksi mentah, diambil sekali saja
  const [allTransactions, setAllTransactions] = useState([]);
  
  // State untuk menyimpan data yang sudah dikalkulasi untuk ditampilkan
  const [displayData, setDisplayData] = useState(null);

  useEffect(() => {
    // Fungsi ini hanya memeriksa peran dan mengambil semua data sekali
    const checkUserRoleAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/'); return; }

      const { data: role } = await supabase.rpc('get_user_role');
      if (role !== 'manajer') {
        await logActivity('ACCESS_DENIED', { attemptedPage: '/dashboard', userRole: role || 'unknown' });
        toast.error('Akses ditolak. Anda bukan manajer.');
        await supabase.auth.signOut();
        router.push('/');
        return;
      }
      setUser(session.user);
      
      const { data, error } = await supabase.from('transaksi_pertalite').select('*').order('waktu_pencatatan', { ascending: false });
      if (error) {
        toast.error("Gagal memuat data utama.");
        console.error(error);
      } else {
        setAllTransactions(data);
      }
      setIsLoading(false);
    };
    checkUserRoleAndFetch();
  }, [router]);

  useEffect(() => {
    // useEffect ini berjalan setiap kali 'view' atau 'allTransactions' berubah
    if (allTransactions.length === 0) return;

    const now = new Date();
    let filteredData;
    let title;

    if (view === 'today') {
      const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
      filteredData = allTransactions.filter(t => new Date(t.waktu_pencatatan) >= todayStart);
      title = "Analitik Hari Ini";
    } else if (view === 'weekly') {
      const weekStart = new Date(new Date().setDate(now.getDate() - 7));
      filteredData = allTransactions.filter(t => new Date(t.waktu_pencatatan) >= weekStart);
      title = "Analitik 7 Hari Terakhir";
    } else if (view === 'monthly') {
        const monthStart = new Date(new Date().setDate(now.getDate() - 30));
        filteredData = allTransactions.filter(t => new Date(t.waktu_pencatatan) >= monthStart);
        title = "Analitik 30 Hari Terakhir";
    } else { // 'all'
      filteredData = allTransactions;
      title = "Analitik Keseluruhan (All-Time)";
    }

    // --- MULAI KALKULASI DATA ---
    const totalTransaksi = filteredData.length;
    const totalLiter = filteredData.reduce((sum, trx) => sum + trx.liter, 0);
    const totalPendapatan = filteredData.reduce((sum, trx) => sum + trx.harga, 0);
    const avgLiter = totalTransaksi > 0 ? totalLiter / totalTransaksi : 0;
    
    const platCounts = filteredData.reduce((acc, trx) => {
        acc[trx.plat_nomor] = (acc[trx.plat_nomor] || 0) + 1;
        return acc;
    }, {});
    const topPlat = Object.keys(platCounts).length > 0 ? Object.keys(platCounts).reduce((a, b) => platCounts[a] > platCounts[b] ? a : b) : 'N/A';

    const vehicleData = filteredData.reduce((acc, trx) => {
        const type = trx.jenis_kendaraan || 'Tidak Diketahui'; // Perbaikan label
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    const vehicleDistribution = {
        labels: Object.keys(vehicleData),
        datasets: [{ data: Object.values(vehicleData), backgroundColor: ['#3B82F6', '#10B981', '#9CA3AF'] }]
    };

    const shiftData = filteredData.reduce((acc, trx) => {
        const shift = `Shift ${trx.shift || 'N/A'}`;
        acc[shift] = (acc[shift] || 0) + 1;
        return acc;
    }, {});
    const shiftDistribution = {
        labels: Object.keys(shiftData),
        datasets: [{ data: Object.values(shiftData), backgroundColor: ['#F59E0B', '#EF4444', '#8B5CF6'] }]
    };

    const operatorPerformance = Object.entries(filteredData.reduce((acc, trx) => {
        const email = trx.operator_email || 'Tidak Diketahui';
        if (!acc[email]) acc[email] = 0;
        acc[email] += trx.liter;
        return acc;
    }, {})).map(([email, liters]) => ({ email, totalLiters: liters })).sort((a,b) => b.totalLiters - a.totalLiters).slice(0, 5);
    
    const customerPerformance = Object.entries(platCounts).map(([plate, count]) => ({ plate, totalFills: count })).sort((a,b) => b.totalFills - a.totalFills).slice(0, 5);

    setDisplayData({
        title, totalTransaksi, totalLiter, totalPendapatan, avgLiter, topPlat,
        vehicleDistribution, shiftDistribution, operatorPerformance, customerPerformance
    });

  }, [view, allTransactions]);

  const handleLogout = async () => {
    await logActivity('LOGOUT');
    await supabase.auth.signOut();
    toast.success('Anda berhasil logout.');
    router.push('/');
  };

  if (isLoading || !user) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Dashboard Analitik</h1>
            <p className="text-md text-gray-500">Pusat komando untuk keseluruhan performa SPBU.</p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link href="/laporan" className="text-green-600 hover:text-green-800 font-bold">Buat Laporan &rarr;</Link>
            <Link href="/riwayat" className="text-blue-500 hover:text-blue-700 font-bold">Lihat Riwayat &rarr;</Link>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
          </div>
        </div>

        <div className="flex justify-center flex-wrap gap-2 mb-8 bg-white p-2 rounded-lg shadow-sm">
            <button onClick={() => setView('today')} className={`px-4 py-2 rounded-md font-semibold text-sm ${view === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Hari Ini</button>
            <button onClick={() => setView('weekly')} className={`px-4 py-2 rounded-md font-semibold text-sm ${view === 'weekly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>7 Hari Terakhir</button>
            <button onClick={() => setView('monthly')} className={`px-4 py-2 rounded-md font-semibold text-sm ${view === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>30 Hari Terakhir</button>
            <button onClick={() => setView('all')} className={`px-4 py-2 rounded-md font-semibold text-sm ${view === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Semua</button>
        </div>
        
        {displayData && (
            <div id="analytics-content">
                <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-6">{displayData.title}</h2>
                
                {/* Bagian Statistik Utama */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <StatCard title="Total Transaksi" value={displayData.totalTransaksi.toLocaleString('id-ID')} unit="kendaraan" />
                    <StatCard title="Total Liter" value={displayData.totalLiter.toLocaleString('id-ID', { maximumFractionDigits: 2 })} unit="L" />
                    <StatCard title="Pendapatan Kotor" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(displayData.totalPendapatan)} smallText={true}/>
                    <StatCard title="Rata-rata/Transaksi" value={displayData.avgLiter.toLocaleString('id-ID', { maximumFractionDigits: 2 })} unit="L" />
                    <StatCard title="Plat Paling Sering" value={displayData.topPlat} smallText={true} />
                </div>
                
                {/* Bagian Grafik dan Aktivitas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-1">
                        <RecentActivity transactions={allTransactions} />
                    </div>
                    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Kendaraan</h3>
                        <Pie data={displayData.vehicleDistribution} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                    <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Distribusi Shift</h3>
                        <Pie data={displayData.shiftDistribution} options={{ plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>

                {/* Bagian Leaderboards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Leaderboard title="Top 5 Operator (Total Liter)" data={displayData.operatorPerformance} valueKey="totalLiters" labelKey="email" unit="L" />
                    <Leaderboard title="Top 5 Pelanggan (Jumlah Isi)" data={displayData.customerPerformance} valueKey="totalFills" labelKey="plate" unit="kali" />
                </div>
            </div>
        )}

      </div>
    </div>
  );
}