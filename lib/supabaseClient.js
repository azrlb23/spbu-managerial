import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logActivity = async (action, details = {}) => {
  try {
    // 1. Dapatkan informasi pengguna yang sedang login saat ini.
    const { data: { user } } = await supabase.auth.getUser();
    
    // 2. Simpan log ke tabel 'activity_logs'.
    const { error } = await supabase.from('activity_logs').insert({
      user_email: user ? user.email : 'anonymous', // Catat email jika ada, jika tidak catat sebagai 'anonymous'
      action, // Aksi yang dilakukan (misal: 'LOGIN_SUCCESS')
      details // Detail tambahan dalam format JSON (misal: plat nomor)
    });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Failed to execute logActivity:', error);
  }
};