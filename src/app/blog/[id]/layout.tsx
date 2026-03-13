import type { Metadata } from "next";

type BlogDto = {
  title?: string;
  content?: string;
  cover_image?: string;
};

const API_BASE = "https://my-personal-website-backend-seven.vercel.app";
const SITE_BASE = "https://concepts-blog.vercel.app";

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(input: string, max = 160) {
  if (input.length <= max) return input;
  return input.slice(0, max).trimEnd() + "...";
}

function pickOgImage(cover?: string) {
  if (!cover) return `${SITE_BASE}/concept.png`;

  if (cover.startsWith("http://") || cover.startsWith("https://")) {
    return cover;
  }

  return `${API_BASE}${cover.startsWith("/") ? cover : `/${cover}`}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/blogs/${id}`, {
      next: { revalidate: 120 },
    });

    if (!res.ok) {
      return {
        title: "Story",
        description: "Read this story on Concepts blog.",
      };
    }

    const blog = (await res.json()) as BlogDto;
    const title = (blog.title || "Story").trim();
    const description = truncate(stripHtml(blog.content || "Read this story on Concepts blog."));
    const image = pickOgImage(blog.cover_image);
    const url = `${SITE_BASE}/blog/${id}`;

    return {
      title,
      description,
      alternates: {
        canonical: `/blog/${id}`,
      },
      openGraph: {
        type: "article",
        siteName: "Concepts",
        title,
        description,
        url,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: "Story",
      description: "Read this story on Concepts blog.",
    };
  }
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}