import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Stories",
  description: "Read all stories from Concepts blog.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    type: "website",
    siteName: "Concepts",
    title: "All Stories | Concepts",
    description: "Read all stories from Concepts blog.",
    url: "https://concepts-blog.vercel.app/blog",
    images: [
      {
        url: "/concept.png",
        width: 1200,
        height: 630,
        alt: "Concepts Blog Stories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "All Stories | Concepts",
    description: "Read all stories from Concepts blog.",
    images: ["/concept.png"],
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}