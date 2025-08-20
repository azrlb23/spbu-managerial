import { Inter } from "next/font/google";
import "./globals.css";
import Template from "../components/template";
import { Toaster } from 'react-hot-toast'; // <-- 1. Import Toaster

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SPBU Managerial",
  description: "Aplikasi Pencatatan Pertalite",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {/* 2. Tambahkan komponen Toaster di sini */}
        <Toaster position="top-center" reverseOrder={false} />
        <main className="min-h-screen bg-gray-50">
          <Template>{children}</Template>
        </main>
      </body>
    </html>
  );
}