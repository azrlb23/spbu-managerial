'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast'; // 1. Import toast

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // const [message, setMessage] = useState(''); // 2. Hapus state message
  const router = useRouter();

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: role } = await supabase.rpc('get_user_role');
        if (role === 'manajer') {
          router.push('/dashboard');
        } else if (role === 'operator') {
          router.push('/operator');
        }
      }
    };
    checkSessionAndRedirect();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const { data: { session }, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      toast.error(`Gagal login: ${error.message}`); // 3. Ganti dengan toast.error
      setIsLoading(false);
    } else if (session) {
      const { data: role, error: rpcError } = await supabase.rpc('get_user_role');

      if (rpcError) {
         toast.error(`Gagal mendapatkan peran: ${rpcError.message}`);
         setIsLoading(false);
      } else {
        toast.success('Login berhasil!'); // Tambahkan notifikasi sukses
        if (role === 'manajer') {
          router.push('/dashboard');
        } else if (role === 'operator') {
          router.push('/operator');
        } else {
          toast.error('Peran tidak dikenali. Hubungi administrator.');
          await supabase.auth.signOut();
          setIsLoading(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">SPBUManagerial Login</h1>
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">Password</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700" required />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400">
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>
        {/* 4. Hapus tampilan message statis */}
      </div>
    </div>
  );
}