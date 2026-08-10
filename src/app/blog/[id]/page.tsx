import type { Metadata } from "next";
import BlogPostClient from "./BlogPostClient";

interface Blog {
    _id?: string;
    id?: string;
    title: string;
    content: string;
    cover_image?: string;
    type?: string;
    created_at?: string;
    updated_at?: string;
    author?: string;
}

const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const siteBase = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const dynamic = "force-dynamic";

function stripHtml(html?: string): string {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function resolveImageUrl(image?: string): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${backendBase}${image}`;
}

async function getBlog(blogId: string): Promise<Blog | null> {
    try {
        const response = await fetch(`${backendBase}/blogs/${blogId}`, {
            cache: "no-store",
        });

        if (!response.ok) {
            return null;
        }

        return response.json();
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const blog = await getBlog(params.id);

    if (!blog) {
        return {
            title: "Blog not found | Concepts",
            description: "The requested blog post could not be found.",
        };
    }

    const description = stripHtml(blog.content).slice(0, 160) || "Read this article on Concepts.";
    const updatedAt = blog.updated_at ? new Date(blog.updated_at).getTime() : Date.now();
    // Use the backend's OG image proxy endpoint — it serves images with
    // no-cache headers, so LinkedIn/Facebook crawlers always get the latest image.
    const ogImageUrl = blog.cover_image
        ? `${backendBase}/blogs/${params.id}/og-image?v=${updatedAt}`
        : `${siteBase}/concept.png`;
    const shareImage = new URL(ogImageUrl, siteBase);

    const canonicalUrl = `${siteBase}/blog/${params.id}`;

    return {
        title: `${blog.title} | Concepts`,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: blog.title,
            description,
            url: canonicalUrl,
            siteName: "Concepts",
            type: "article",
            images: [
                {
                    url: shareImage.toString(),
                    width: 1200,
                    height: 630,
                    alt: blog.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: blog.title,
            description,
            images: [shareImage.toString()],
        },
    };
}

export default async function BlogPostPage({ params }: { params: { id: string } }) {
    const blog = await getBlog(params.id);

    return <BlogPostClient blogId={params.id} initialBlog={blog} />;
}
