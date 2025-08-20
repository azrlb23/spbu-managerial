'use client';

import { useState, useEffect } from 'react';
import { supabase, logActivity } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, unit }) => (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="mt-1 text-3xl font-semibold text-gray-900">
            {value} {unit && <span className="text-lg font-normal">{unit}</span>}
        </p>
    </div>
);

export default function LaporanPage() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        const checkUserRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }
            const { data: role } = await supabase.rpc('get_user_role');
            if (role !== 'manajer') {
                await logActivity('ACCESS_DENIED', { attemptedPage: '/laporan', userRole: role || 'unknown' });
                toast.error('Akses ditolak. Anda bukan manajer.');
                await supabase.auth.signOut();
                router.push('/login');
            } else {
                setUser(session.user);
            }
        };
        checkUserRole();
    }, [router]);

    const handleGenerateReport = async () => {
        if (!startDate || !endDate) {
            toast.error('Silakan pilih rentang tanggal terlebih dahulu.');
            return;
        }
        
        setIsLoading(true);
        setReportData(null);
        const loadingToast = toast.loading('Membuat laporan...');

        const gte = `${startDate}T00:00:00.000Z`;
        const lte = `${endDate}T23:59:59.999Z`;

        const { data, error } = await supabase
            .from('transaksi_pertalite')
            .select('liter, harga, plat_nomor, waktu_pencatatan, operator_email, jenis_kendaraan')
            .gte('waktu_pencatatan', gte)
            .lte('waktu_pencatatan', lte)
            .order('waktu_pencatatan', { ascending: false });

        toast.dismiss(loadingToast);
        
        if (error) {
            toast.error(`Gagal mengambil data: ${error.message}`);
        } else {
            const totalTransaksi = data.length;
            const totalLiter = data.reduce((sum, trx) => sum + trx.liter, 0);
            const totalPendapatan = data.reduce((sum, trx) => sum + trx.harga, 0);

            setReportData({
                totalTransaksi,
                totalLiter: totalLiter.toFixed(2),
                totalPendapatan,
                transactions: data
            });
            toast.success('Laporan berhasil dibuat!');
            await logActivity('GENERATE_REPORT', { 
                startDate, 
                endDate, 
                results: { totalTransaksi: data.length } 
            });
        }
        setIsLoading(false);
    };

    if (!user) {
        return <div className="min-h-screen flex items-center justify-center">Memverifikasi...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-md p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Ringkasan Laporan Performa</h1>
                            <p className="text-sm text-gray-500">Pilih rentang tanggal untuk melihat ringkasan.</p>
                        </div>
                        <Link href="/dashboard" className="text-blue-500 hover:text-blue-700 font-bold mt-4 sm:mt-0">
                            &larr; Kembali ke Dashboard
                        </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center p-4 bg-gray-100 rounded-lg mb-8">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3 text-gray-900"/>
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Tanggal Akhir</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3 text-gray-900"/>
                        </div>
                        <div className="self-end">
                            <button onClick={handleGenerateReport} disabled={isLoading} className="bg-green-600 hover:bg-green-800 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
                                {isLoading ? 'Memproses...' : 'Buat Laporan'}
                            </button>
                        </div>
                    </div>

                    {reportData && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                Hasil Laporan untuk {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <StatCard title="Total Transaksi" value={reportData.totalTransaksi} unit="kendaraan" />
                                <StatCard title="Total Liter Terjual" value={reportData.totalLiter} unit="L" />
                                <StatCard title="Total Pendapatan Kotor" value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(reportData.totalPendapatan)} />
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detail Transaksi</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Waktu</th>
                                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Plat Nomor</th>
                                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Jenis</th>
                                            <th className="py-2 px-4 text-left text-sm font-medium text-gray-600">Operator</th>
                                            <th className="py-2 px-4 text-right text-sm font-medium text-gray-600">Liter</th>
                                            <th className="py-2 px-4 text-right text-sm font-medium text-gray-600">Harga</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {reportData.transactions.map((trx, index) => (
                                            <tr key={index}>
                                                <td className="py-2 px-4 text-sm text-gray-800">{new Date(trx.waktu_pencatatan).toLocaleString('id-ID')}</td>
                                                <td className="py-2 px-4 font-medium text-gray-900">{trx.plat_nomor}</td>
                                                <td className="py-2 px-4 text-sm text-gray-800">{trx.jenis_kendaraan || '-'}</td>
                                                <td className="py-2 px-4 text-sm text-gray-600">{trx.operator_email || 'N/A'}</td>
                                                <td className="py-2 px-4 text-right text-gray-800">{trx.liter.toFixed(2)} L</td>
                                                <td className="py-2 px-4 text-right text-gray-800">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(trx.harga)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}