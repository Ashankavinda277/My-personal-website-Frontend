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
  openGraph: {
    type: "website",
    siteName: "Concepts",
    url: "https://concepts-blog.vercel.app",
    title: "Concepts",
    description: "Created by concepts.com",
    images: [
      {
        url: "/concept.png",
        width: 1200,
        height: 630,
        alt: "Concepts Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Concepts",
    description: "Created by concepts.com",
    images: ["/concept.png"],
  },
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