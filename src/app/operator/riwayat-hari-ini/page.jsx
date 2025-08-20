'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td data-label="Waktu" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td data-label="Plat Nomor" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td data-label="Jenis" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
      <td data-label="Liter" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
      <td data-label="Harga" className="py-4 px-4"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
    </tr>
);

export default function RiwayatOperatorPage() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const router = useRouter();
    
    const [filterPlat, setFilterPlat] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(15);

    const fetchTodaysTransactions = async (currentUser) => {
        if (!currentUser) return;

        setIsLoading(true);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const awalHariIni = today.toISOString();

        let query = supabase
            .from('transaksi_pertalite')
            .select('*')
            .gte('waktu_pencatatan', awalHariIni)
            .order('waktu_pencatatan', { ascending: false });
        
        if (filterPlat.trim()) {
            query = query.ilike('plat_nomor', `%${filterPlat.trim()}%`);
        }

        const startIndex = (currentPage - 1) * itemsPerPage;
        query = query.range(startIndex, startIndex + itemsPerPage - 1);

        const { data, error } = await query;
        if (error) {
            console.error("Gagal mengambil data riwayat operator:", error);
        } else {
            setTransactions(data);
        }
        setIsLoading(false);
    };
    
    useEffect(() => {
        const checkUser = async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            router.push('/');
          } else {
            setUser(session.user);
          }
        };
        checkUser();
      }, [router]);

    useEffect(() => {
        if (user) {
            fetchTodaysTransactions(user);
        }
    }, [filterPlat, currentPage, user]);


    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Memverifikasi...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Riwayat Seluruh Transaksi Hari Ini</h1>
                        <p className="text-sm text-gray-500">Login sebagai: {user.email}</p>
                    </div>
                    <Link href="/operator" className="text-blue-500 hover:text-blue-700 font-bold mt-4 sm:mt-0">
                        &larr; Kembali ke Halaman Input
                    </Link>
                </div>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Cari Plat Nomor..."
                        value={filterPlat}
                        onChange={e => {
                            setFilterPlat(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="shadow-sm appearance-none border rounded w-full sm:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="responsive-table">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plat Nomor</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liter</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : transactions.length > 0 ? (
                                transactions.map(t => (
                                    <tr key={t.id}>
                                        <td data-label="Waktu" className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{new Date(t.waktu_pencatatan).toLocaleTimeString('id-ID')}</td>
                                        <td data-label="Plat Nomor" className="py-4 px-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.plat_nomor}</td>
                                        <td data-label="Jenis" className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{t.jenis_kendaraan || '-'}</td>
                                        <td data-label="Liter" className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">{t.liter} L</td>
                                        <td data-label="Harga" className="py-4 px-4 whitespace-nowrap text-sm text-gray-800">
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(t.harga)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-500">
                                        {filterPlat ? `Plat nomor "${filterPlat}" tidak ditemukan.` : "Belum ada transaksi hari ini."}
                                    </td>
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
                        disabled={transactions.length < itemsPerPage || isLoading}
                        className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2 px-4 rounded"
                    >
                        Berikutnya
                    </button>
                </div>
            </div>
        </div>
    );
}