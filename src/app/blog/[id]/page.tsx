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

export const dynamic = "force-dynamic";

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

export default async function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const blog = await getBlog(id);

    return <BlogPostClient blogId={id} initialBlog={blog} />;
}

