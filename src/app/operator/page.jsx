'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, logActivity } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion'; // 1. Import motion dan AnimatePresence

export default function OperatorPage() {
  const [user, setUser] = useState(null);
  const [jenisKendaraan, setJenisKendaraan] = useState(null);
  const [platNomor, setPlatNomor] = useState('');
  const [liter, setLiter] = useState('');
  const [harga, setHarga] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [platStatus, setPlatStatus] = useState('idle');
  const [checkedPlat, setCheckedPlat] = useState('');
  
  const literInputRef = useRef(null);
  const platNomorInputRef = useRef(null);
  const router = useRouter();
  const HARGA_PER_LITER = 10000;

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

  useEffect(() => {
    const literNum = parseFloat(liter);
    if (!isNaN(literNum) && literNum > 0) {
      setHarga(literNum * HARGA_PER_LITER);
    } else {
      setHarga(0);
    }
  }, [liter]);
  
  const handleLogout = async () => {
    await logActivity('LOGOUT');
    await supabase.auth.signOut();
    toast.success('Anda berhasil logout.');
    router.push('/');
  };

  const handleCheckPlat = async () => {
    if (!platNomor.trim()) {
      toast.error('Plat nomor harus diisi.');
      return;
    }
    const platRegex = /^[A-Z]{1,2}\s[0-9]{1,4}\s[A-Z]{1,3}$/;
    const currentPlat = platNomor.toUpperCase().trim();
    if (!platRegex.test(currentPlat)) {
      toast.error('Format plat nomor tidak valid. Contoh: KT 1234 ABC');
      return;
    }
    
    const loadingToast = toast.loading('Memeriksa plat nomor...');
    setPlatStatus('checking');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const awalHariIni = today.toISOString();
    const { data: existingData, error: checkError } = await supabase
      .from('transaksi_pertalite')
      .select('plat_nomor')
      .eq('plat_nomor', currentPlat)
      .gte('waktu_pencatatan', awalHariIni);

    toast.dismiss(loadingToast);

    if (checkError) {
      toast.error(`Gagal memeriksa data: ${checkError.message}`);
      setPlatStatus('idle');
    } else if (existingData && existingData.length > 0) {
      toast.error(`Plat ${currentPlat} sudah mengisi hari ini.`);
      await logActivity('CHECK_PLATE_FAILED', { plate: currentPlat, reason: 'Already filled today' });
      setPlatStatus('denied');
    } else {
      toast.success(`Plat ${currentPlat} boleh mengisi.`);
      setPlatStatus('allowed');
      setCheckedPlat(currentPlat);
      setTimeout(() => literInputRef.current?.focus(), 100);
    }
  };
  
  useEffect(() => {
    setPlatStatus('idle');
  }, [platNomor]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (platStatus !== 'allowed' || !user || !jenisKendaraan) return;
    if (!liter.trim() || parseFloat(liter) <= 0) {
      toast.error('Jumlah liter harus diisi dengan benar.');
      return;
    }
    setIsLoading(true);
    const loadingToast = toast.loading('Menyimpan transaksi...');

    const { data: insertedData, error: insertError } = await supabase
      .from('transaksi_pertalite')
      .insert([{
        plat_nomor: checkedPlat,
        liter: parseFloat(liter),
        harga,
        operator_id: user.id,
        operator_email: user.email,
        jenis_kendaraan: jenisKendaraan
      }])
      .select();
    
    toast.dismiss(loadingToast);
    setIsLoading(false);

    if (insertError) {
      toast.error(`Gagal menyimpan data: ${insertError.message}`);
      await logActivity('TRANSACTION_INSERT_FAILED', { plate: checkedPlat, error: insertError.message });
    } else {
      toast.success('Data berhasil disimpan!');
      await logActivity('CREATE_TRANSACTION', { 
        transactionId: insertedData[0].id,
        plate: checkedPlat, 
        liters: parseFloat(liter),
        vehicle: jenisKendaraan 
    });
      setPlatNomor('');
      setLiter('');
      setPlatStatus('idle');
      setCheckedPlat('');
      setJenisKendaraan(null);
      platNomorInputRef.current?.focus();
    }
  };
  
  if (!user) return <div className="min-h-screen flex items-center justify-center">Memverifikasi...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-between items-center">
          <Link href="/operator/riwayat-hari-ini" className="text-blue-500 hover:text-blue-700 font-bold">
            Lihat Riwayat Hari Ini &rarr;
          </Link>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 overflow-hidden">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Operator Dashboard</h1>
          <p className="text-center text-sm text-gray-500 mb-8">{user.email}</p>

          {/* 2. Bungkus area kondisional dengan AnimatePresence */}
          <AnimatePresence mode="wait">
            {!jenisKendaraan ? (
              <motion.div
                key="selection" // Kunci unik untuk elemen ini
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <label className="block text-gray-700 text-sm font-bold mb-4 text-center">Pilih Jenis Kendaraan</label>
                <div className="flex justify-center gap-4">
                  <button onClick={() => setJenisKendaraan('Mobil')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded text-lg">Mobil</button>
                  <button onClick={() => setJenisKendaraan('Motor')} className="bg-green-500 hover:bg-green-700 text-white font-bold py-4 px-8 rounded text-lg">Motor</button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form" // Kunci unik untuk elemen ini
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
              >
                <div className="mb-4 flex justify-between items-center">
                    <p className="text-lg font-semibold text-gray-700">Jenis: <span className="text-blue-600 font-bold">{jenisKendaraan}</span></p>
                    <button onClick={() => setJenisKendaraan(null)} className="text-xs text-red-500 hover:underline">Ganti Jenis</button>
                </div>

                {/* Bagian form asli Anda dimulai di sini, tidak ada yang diubah */}
                <div className="mb-4">
                  <label htmlFor="platNomor" className="block text-gray-700 text-sm font-bold mb-2">
                    Plat Nomor
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={platNomorInputRef}
                      type="text"
                      id="platNomor"
                      value={platNomor}
                      onChange={(e) => setPlatNomor(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCheckPlat()}
                      className="flex-grow shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline uppercase"
                      placeholder="KT 1234 ABC"
                      required
                      disabled={platStatus === 'allowed'}
                    />
                    <button
                      type="button"
                      onClick={handleCheckPlat}
                      disabled={platStatus !== 'idle' || !platNomor.trim()}
                      className="bg-gray-600 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded disabled:bg-gray-300 transition-colors"
                    >
                      {platStatus === 'checking' ? '...' : 'Cek'}
                    </button>
                  </div>
                </div>
                
                {platStatus === 'allowed' && (
                  <form onSubmit={handleSubmit} className="mt-6 border-t pt-6">
                    <div className="mb-6">
                      <label htmlFor="liter" className="block text-gray-700 text-sm font-bold mb-2">
                        Jumlah Liter
                      </label>
                      <input
                        type="number"
                        id="liter"
                        ref={literInputRef}
                        inputMode="decimal"
                        value={liter}
                        onChange={(e) => setLiter(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Contoh: 15.5"
                        step="0.01"
                        min="0.1"
                        required
                      />
                    </div>
                    <div className="mb-8 p-4 bg-gray-100 rounded-lg text-center">
                      <p className="text-gray-600 text-sm">Total Harga</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(harga)}
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 ${isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'}`}
                      >
                        {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}