"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../utils/api";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";
import { formatDate, calculateReadTime } from "../../../utils/format";

interface Blog {
    _id?: string;
    id?: string;
    title: string;
    content: string;
    cover_image?: string;
    type?: string;
    created_at?: string;
    author?: string;
}

export default function BlogPost() {
    const { id } = useParams();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        api.get(`/blogs/${id}`)
            .then((res) => {
                setBlog(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load blog", err);
                setLoading(false);
            });
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <div className="animate-pulse">Loading story...</div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
                <h1 className="text-2xl">Blog not found</h1>
                <Link href="/" className="text-purple-400 hover:underline">Go Home</Link>
            </div>
        );
    }

    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

    return (
        <article className="min-h-screen bg-black text-gray-200 pb-20 pt-20">
            {/* Header Section */}
            <div className="container mx-auto max-w-4xl px-6 mb-8 mt-8">
                {/* Back Button */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Articles
                </Link>

                {/* Article Header Information */}
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                    {blog.title}
                </h1>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    {blog.type && (
                        <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20">
                            {blog.type}
                        </span>
                    )}
                    <span className="flex items-center gap-2"><User size={15} /> {blog.author || "Admin"}</span>
                    <span className="flex items-center gap-2"><Calendar size={15} /> {formatDate(blog.created_at)}</span>
                    <span className="flex items-center gap-2"><Clock size={15} /> {calculateReadTime(blog.content)}</span>
                </div>
            </div>

            {/* Hero Image */}
            <div className="container mx-auto max-w-4xl px-6 mb-12">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 shadow-2xl">
                    {blog.cover_image ? (
                        <img
                            src={blog.cover_image?.startsWith('http') ? blog.cover_image : `${backendBase}${blog.cover_image}`}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-black select-none flex items-center justify-center">
                            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 opacity-30">
                                {blog.type || "Story"}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Content Body */}
                    <div
                        className="prose prose-invert prose-lg md:prose-xl max-w-none text-gray-300 leading-relaxed
                                   prose-headings:text-white prose-a:text-purple-400 hover:prose-a:text-purple-300
                                   prose-img:rounded-xl prose-img:border prose-img:border-white/10"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                </motion.div>
            </div>
        </article>
    );
}
