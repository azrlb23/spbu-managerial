'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient'; // Path sudah disesuaikan untuk folder src
import Link from 'next/link';

export default function Home() {
  const [platNomor, setPlatNomor] = useState('');
  const [liter, setLiter] = useState('');
  const [harga, setHarga] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const HARGA_PER_LITER = 10000;

  useEffect(() => {
    const literNum = parseFloat(liter);
    if (!isNaN(literNum) && literNum > 0) {
      setHarga(literNum * HARGA_PER_LITER);
    } else {
      setHarga(0);
    }
  }, [liter]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!platNomor.trim() || !liter.trim() || parseFloat(liter) <= 0) {
      setMessage({ type: 'error', text: 'Plat nomor dan liter harus diisi dengan benar.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const awalHariIni = today.toISOString();
    
    const { data: existingData, error: checkError } = await supabase
      .from('transaksi_pertalite')
      .select('plat_nomor')
      .eq('plat_nomor', platNomor.toUpperCase().trim())
      .gte('waktu_pencatatan', awalHariIni);

    if (checkError) {
      setMessage({ type: 'error', text: `Gagal memeriksa data: ${checkError.message}` });
      setIsLoading(false);
      // Tambahkan timeout di sini juga untuk konsistensi
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    if (existingData && existingData.length > 0) {
      setMessage({ type: 'error', text: `Error: Plat nomor ${platNomor.toUpperCase().trim()} sudah mengisi hari ini.` });
      setIsLoading(false);
      
      // --- INI BARIS YANG DITAMBAHKAN ---
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      // ------------------------------------
      
      return;
    }

    const { error: insertError } = await supabase
      .from('transaksi_pertalite')
      .insert([
        { plat_nomor: platNomor.toUpperCase().trim(), liter: parseFloat(liter), harga },
      ]);

    setIsLoading(false);

    if (insertError) {
      setMessage({ type: 'error', text: `Gagal menyimpan data: ${insertError.message}` });
    } else {
      setMessage({ type: 'success', text: 'Data berhasil disimpan!' });
      setPlatNomor('');
      setLiter('');
    }

    // Timeout ini sekarang hanya untuk pesan sukses/gagal insert
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">SPBUManagerialV1</h1>
        <h2 className="text-lg text-center text-gray-600 mb-8">Pencatatan Pertalite</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="platNomor" className="block text-gray-700 text-sm font-bold mb-2">
              Plat Nomor
            </label>
            <input
              type="text"
              id="platNomor"
              value={platNomor}
              onChange={(e) => setPlatNomor(e.target.value)}
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline uppercase"
              placeholder="KT 1234 ABC"
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="liter" className="block text-gray-700 text-sm font-bold mb-2">
              Jumlah Liter
            </label>
            <input
              type="number"
              id="liter"
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
              className={`w-full text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200 ${
                isLoading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>

        {message.text && (
          <div className={`mt-6 p-3 rounded text-center text-white ${
            message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}>
            {message.text}
          </div>
        )}
      </div>
      <div className="mt-8">
        <Link href="/riwayat" className="text-blue-500 hover:text-blue-700 font-bold">
          Lihat Riwayat Transaksi &rarr;
        </Link>
      </div>
    </div>
  );
}