import type { Metadata } from "next";
import "../css/global.css";
import { Inter, JetBrains_Mono } from "next/font/google";
import Navbar from "../components/Navbar";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Concepts",
  description: "Created by concepts.com",
  icons: {
    icon: '/concept.png',
    apple: '/concept.png',
  },
};

export default function RootLayout({

  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetMono.variable} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}