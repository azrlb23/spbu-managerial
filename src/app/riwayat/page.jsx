'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient'; // Path sudah disesuaikan untuk folder src
import Link from 'next/link';

export default function RiwayatPage() {
  const [transaksi, setTransaksi] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPlat, setFilterPlat] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');

  useEffect(() => {
    const fetchTransaksi = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('transaksi_pertalite')
        .select('*')
        .order('waktu_pencatatan', { ascending: false }); 

      if (error) {
        setError(error.message);
      } else {
        setTransaksi(data);
      }
      setIsLoading(false);
    };

    fetchTransaksi();
  }, []);

  const filteredTransaksi = useMemo(() => {
    return transaksi.filter(t => {
      const platMatch = t.plat_nomor.toLowerCase().includes(filterPlat.toLowerCase());
      const tanggalMatch = filterTanggal ? new Date(t.waktu_pencatatan).toISOString().slice(0, 10) === filterTanggal : true;
      return platMatch && tanggalMatch;
    });
  }, [transaksi, filterPlat, filterTanggal]);

  if (isLoading) {
    return <div className="text-center p-10">Memuat data...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">Gagal memuat data: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Transaksi Pertalite</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700 mt-4 sm:mt-0">
            &larr; Kembali ke Pencatatan
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Cari Plat Nomor..."
            value={filterPlat}
            onChange={e => setFilterPlat(e.target.value)}
            className="shadow-sm appearance-none border rounded w-full sm:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <input
            type="date"
            value={filterTanggal}
            onChange={e => setFilterTanggal(e.target.value)}
            className="shadow-sm appearance-none border rounded w-full sm:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plat Nomor</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liter</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransaksi.length > 0 ? (
                filteredTransaksi.map(t => (
                  <tr key={t.id}>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">
                      {new Date(t.waktu_pencatatan).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.plat_nomor}</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{t.liter} L</td>
                    <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">
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
      </div>
    </div>
  );
}