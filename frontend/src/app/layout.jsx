/* eslint-disable @next/next/no-sync-scripts */

import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { ToastContainer } from "react-toastify";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "WebClassroom - Learning Management System",
  description:
    "A digital classroom for students and lecturers to connect and share course materials",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head></head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow bg-background justify-center items-center">
              {children}
            </main>
          </div>
        </AuthProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
