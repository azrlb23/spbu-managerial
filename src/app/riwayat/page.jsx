'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse'; // 1. Import library papaparse

// ... (Komponen SkeletonRow dan SortIcon tetap sama)
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td data-label="Waktu" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
    <td data-label="Plat Nomor" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
    <td data-label="Liter" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
    <td data-label="Harga" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
  </tr>
);

const SortIcon = ({ direction }) => {
  if (!direction) return ' ↕';
  return direction === 'asc' ? ' ▲' : ' ▼';
};


export default function RiwayatPage() {
  const [transaksi, setTransaksi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false); // State baru untuk loading ekspor
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  
  const [filterPlat, setFilterPlat] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState({ key: 'waktu_pencatatan', direction: 'desc' });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
    };
    checkUser();
  }, [router]);

  const fetchTransaksi = async () => {
    setIsLoading(true);
    let query = supabase
      .from('transaksi_pertalite')
      .select('*')
      .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });

    if (filterPlat.trim()) {
      query = query.ilike('plat_nomor', `%${filterPlat.trim()}%`);
    }
    if (filterTanggal) {
      const gte = `${filterTanggal}T00:00:00.000Z`;
      const lte = `${filterTanggal}T23:59:59.999Z`;
      query = query.gte('waktu_pencatatan', gte).lte('waktu_pencatatan', lte);
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    query = query.range(startIndex, startIndex + itemsPerPage - 1);

    const { data, error: dataError } = await query;
    
    if (dataError) {
      setError(dataError.message);
    } else {
      setTransaksi(data);
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (user) {
      fetchTransaksi();
    }
  }, [currentPage, filterPlat, filterTanggal, sortConfig, user]);
  
  // --- FUNGSI BARU UNTUK EKSPOR CSV ---
  const handleExportCSV = async () => {
    setIsExporting(true);
    
    // Ambil SEMUA data yang cocok dengan filter, tanpa paginasi
    let query = supabase
      .from('transaksi_pertalite')
      .select('waktu_pencatatan, plat_nomor, liter, harga') // Pilih kolom yang relevan
      .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' });

    if (filterPlat.trim()) {
      query = query.ilike('plat_nomor', `%${filterPlat.trim()}%`);
    }
    if (filterTanggal) {
      const gte = `${filterTanggal}T00:00:00.000Z`;
      const lte = `${filterTanggal}T23:59:59.999Z`;
      query = query.gte('waktu_pencatatan', gte).lte('waktu_pencatatan', lte);
    }

    const { data, error } = await query;

    if (error) {
        alert("Gagal mengambil data untuk ekspor: " + error.message);
        setIsExporting(false);
        return;
    }

    // Ubah format data agar lebih mudah dibaca di Excel
    const formattedData = data.map(item => ({
        "Waktu Transaksi": new Date(item.waktu_pencatatan).toLocaleString('id-ID'),
        "Plat Nomor": item.plat_nomor,
        "Liter": item.liter,
        "Harga (Rp)": item.harga
    }));

    const csv = Papa.unparse(formattedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `laporan_transaksi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleClearFilters = () => {
    setFilterPlat('');
    setFilterTanggal('');
    setCurrentPage(1);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Mengarahkan...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>
            <p className="text-sm text-gray-500">Login sebagai: {user.email}</p>
          </div>
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            <Link href="/dashboard" className="text-blue-500 hover:text-blue-700 font-bold">
              &larr; Kembali ke Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center flex-wrap">
          <input
            type="text"
            placeholder="Cari Plat Nomor..."
            value={filterPlat}
            onChange={e => setFilterPlat(e.target.value)}
            className="shadow-sm appearance-none border rounded w-full sm:w-auto py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="date"
            value={filterTanggal}
            onChange={e => setFilterTanggal(e.target.value)}
            className="shadow-sm appearance-none border rounded w-full sm:w-auto py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button 
            onClick={handleClearFilters}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Bersihkan
          </button>
          {/* --- TOMBOL EKSPOR BARU --- */}
          <button 
            onClick={handleExportCSV}
            disabled={isExporting}
            className="bg-green-600 hover:bg-green-800 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            {isExporting ? 'Mengekspor...' : 'Ekspor ke CSV'}
          </button>
        </div>

        {error && <div className="text-center p-10 text-red-500">Gagal memuat data: {error}</div>}

        <div className="overflow-x-auto">
          <table className="responsive-table">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => requestSort('waktu_pencatatan')} className="font-bold flex items-center">
                    Waktu
                    <SortIcon direction={sortConfig.key === 'waktu_pencatatan' ? sortConfig.direction : null} />
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => requestSort('plat_nomor')} className="font-bold flex items-center">
                    Plat Nomor
                    <SortIcon direction={sortConfig.key === 'plat_nomor' ? sortConfig.direction : null} />
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => requestSort('liter')} className="font-bold flex items-center">
                    Liter
                    <SortIcon direction={sortConfig.key === 'liter' ? sortConfig.direction : null} />
                  </button>
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button onClick={() => requestSort('harga')} className="font-bold flex items-center">
                    Harga
                    <SortIcon direction={sortConfig.key === 'harga' ? sortConfig.direction : null} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : transaksi.length > 0 ? (
                transaksi.map(t => (
                  <tr key={t.id}>
                    <td data-label="Waktu" className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">
                      {new Date(t.waktu_pencatatan).toLocaleString('id-ID')}
                    </td>
                    <td data-label="Plat Nomor" className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.plat_nomor}</td>
                    <td data-label="Liter" className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{t.liter} L</td>
                    <td data-label="Harga" className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.harga)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-500">Tidak ada data ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 sm:gap-0">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || isLoading}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
            >
              Sebelumnya
            </button>
            <span className="text-gray-700 order-first sm:order-none">Halaman {currentPage}</span>
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={transaksi.length < itemsPerPage || isLoading}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
            >
              Berikutnya
            </button>
        </div>
      </div>
    </div>
  );
}
