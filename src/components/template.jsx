'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const Template = ({ children }) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname} // Kunci unik berdasarkan path halaman
        initial={{ opacity: 0, x: -20 }} // Kondisi awal: transparan dan sedikit di kiri
        animate={{ opacity: 1, x: 0 }} // Kondisi akhir: terlihat dan di posisi normal (masuk dari kiri)
        exit={{ opacity: 0, x: 20 }} // Kondisi saat keluar: transparan dan bergeser ke kanan
        transition={{ duration: 0.2, ease: 'easeInOut' }} // Durasi dipercepat agar terasa lebih responsif
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default Template;
