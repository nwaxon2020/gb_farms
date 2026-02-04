import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AgricNews from "@/components/AgricNews";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✅ UPDATED META FOR SHARING
export const metadata: Metadata = {
  title: "OBAAS Emmanuel Consult | Premium Livestock & Organic Farm Produce",
  description: "Order high-quality livestock, organic poultry, and farm-fresh produce. Priced per KG and delivered fresh to your doorstep.",
  keywords: ["Livestock", "Farm", "Organic Meat", "Poultry", "Agriculture", "OBAAS Emmanuel Consult"],
  
  // WhatsApp & Facebook (OpenGraph)
  openGraph: {
    title: "OBAAS Emmanuel Consult | Premium Livestock & Farm Produce",
    description: "Order high-quality livestock and organic farm produce. Quality guaranteed, priced per KG.",
    url: "https://gbfarms.vercel.app/",
    siteName: "OBAAS Emmanuel Consult",
    images: [
      {
        url: "https://afrimash.com/wp-content/uploads/2021/03/a09e4b7e-27e4-4fe5-b48c-26d75f69a697.jpg", // Place this image in your 'public' folder
        width: 1200,
        height: 630,
        alt: "OBAAS Emmanuel Consult Livestock Display",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "OBAAS Emmanuel Consult | Premium Livestock",
    description: "Quality farm-fresh livestock delivered to you.",
    images: ["https://afrimash.com/wp-content/uploads/2021/03/a09e4b7e-27e4-4fe5-b48c-26d75f69a697.jpg"],
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        {children}
        <AgricNews/>
        <Footer />
        <Toaster/>
      </body>
    </html>
  );
}