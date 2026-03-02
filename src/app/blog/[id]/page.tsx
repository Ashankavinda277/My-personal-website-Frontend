"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "../../../utils/api";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import Link from "next/link";

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
        <article className="min-h-screen bg-black text-gray-200 pb-20 pt-16">
            {/* Hero Image */}
            <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden">
                {blog.cover_image ? (
                    <img
                        src={blog.cover_image?.startsWith('http') ? blog.cover_image : `${backendBase}${blog.cover_image}`}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-b from-purple-900/20 to-black select-none flex items-center justify-center">
                        <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 opacity-30">
                            {blog.type || "Story"}
                        </span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Back Button */}
                <Link href="/" className="absolute top-6 left-6 md:left-20 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <ArrowLeft size={18} /> Back
                </Link>
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-6 -mt-32 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl mx-auto"
                >
                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6 bg-black/40 backdrop-blur-md inline-flex px-4 py-2 rounded-full border border-white/5">
                        {blog.type && <span className="text-purple-400 font-semibold">#{blog.type}</span>}
                        <div className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span className="flex items-center gap-1"><User size={14} /> Written by: {blog.author || "Admin"}</span>
                        <div className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span className="flex items-center gap-1"><Calendar size={14} /> Today</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-10 leading-tight">
                        {blog.title}
                    </h1>

                    {/* Content Body */}
                    <div
                        className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                </motion.div>
            </div>
        </article>
    );
}
