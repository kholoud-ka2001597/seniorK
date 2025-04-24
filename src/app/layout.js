"use client";

import Footer from "@/components/Footer";
import "./globals.css";
import Header from "@/components/Header";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Nunito } from "next/font/google";
import ChatWidget from "@/components/ChatWidget";
import { useEffect, useState } from "react";

const nunito = Nunito({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const [userType, setUserType] = useState("");

  useEffect(() => {
    setUserType(localStorage.getItem("userRole"));
  }, []);

  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <ToastContainer />
        <Header />
        <main className={`flex-grow ${nunito.className}`}>{children}</main>
        {userType !== "ADMIN" && <ChatWidget />}
        <Footer />
      </body>
    </html>
  );
}