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
  metadataBase: new URL("https://concepts-blog.vercel.app"),
  title: {
    default: "Concepts",
    template: "%s | Concepts",
  },
  description: "Created by concepts.com",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  icons: {
    icon: "/concept.png",
    apple: "/concept.png",
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