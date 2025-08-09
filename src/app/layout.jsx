import { Inter } from "next/font/google";
import "./globals.css";
import Template from "../components/template";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "SPBU Managerial",
  description: "Aplikasi Pencatatan Pertalite",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        {/* PERUBAHAN DI SINI:
          Kita membuat sebuah elemen <main> sebagai "panggung" yang permanen.
          Elemen inilah yang memegang warna latar belakang dan tidak akan pernah beranimasi.
          Komponen <Template> dan semua halaman akan dirender di dalamnya.
        */}
        <main className="min-h-screen bg-gray-50">
          <Template>{children}</Template>
        </main>
      </body>
    </html>
  );
}
