"use client";

import { useEffect, useMemo, useState } from "react";
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

interface BlogPostClientProps {
    blogId: string;
    initialBlog: Blog | null;
}

export default function BlogPostClient({ blogId, initialBlog }: BlogPostClientProps) {
    const [blog, setBlog] = useState<Blog | null>(initialBlog);
    const [loading, setLoading] = useState(!initialBlog);

    useEffect(() => {
        if (initialBlog) {
            setBlog(initialBlog);
            setLoading(false);
            return;
        }

        let isMounted = true;

        api.get(`/blogs/${blogId}`)
            .then((res) => {
                if (!isMounted) return;
                setBlog(res.data);
                setLoading(false);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("Failed to load blog", err);
                setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [blogId, initialBlog]);

    const processedContent = useMemo(() => {
        if (!blog?.content) return "";
        if (typeof window === "undefined") return blog.content;

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${blog.content}</div>`, "text/html");
        const container = doc.body.firstElementChild;
        if (!container) return blog.content;

        const textBoxes = container.querySelectorAll('.text-box, .text-box-borderless');

        Array.from(textBoxes).reverse().forEach((textBox) => {
            const el = textBox as HTMLElement;
            const x = parseInt(el.getAttribute('data-x') || '0');
            const width = el.getAttribute('data-width') || '400';
            const height = el.getAttribute('data-height') || 'auto';
            const isFloatingToSide = x !== 0;

            el.style.width = width === 'auto' ? 'auto' : `${width}px`;
            el.style.maxWidth = '100%';
            if (height !== 'auto') {
                el.style.minHeight = `${height}px`;
            }

            el.style.margin = '0';
            el.style.position = 'relative';

            if (isFloatingToSide) {
                let prevSibling = el.previousElementSibling as HTMLElement;

                if (!prevSibling || prevSibling.classList.contains('text-box') || prevSibling.classList.contains('text-box-borderless')) {
                    el.style.marginLeft = x > 0 ? 'auto' : '0';
                    el.style.marginRight = x < 0 ? 'auto' : '0';
                    el.style.display = 'block';
                    return;
                }

                const flexContainer = document.createElement('div');
                flexContainer.className = "flex flex-col md:flex-row gap-6 md:gap-8 items-start my-6";
                flexContainer.style.display = 'flex';
                flexContainer.style.flexWrap = 'wrap';
                flexContainer.style.width = '100%';

                const isRightSide = x > 0;

                prevSibling.style.flex = '1 1 300px';
                prevSibling.style.minWidth = '0';
                prevSibling.style.margin = '0';

                el.style.flex = `0 1 ${width}px`;
                el.style.minWidth = '200px';

                prevSibling.parentNode?.insertBefore(flexContainer, prevSibling);

                if (isRightSide) {
                    flexContainer.appendChild(prevSibling);
                    flexContainer.appendChild(el);
                } else {
                    flexContainer.appendChild(el);
                    flexContainer.appendChild(prevSibling);
                }
            } else {
                el.style.margin = '1.5rem auto';
                el.style.display = 'block';
            }
        });

        return container.innerHTML;
    }, [blog?.content]);

    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0510]">
                <div className="animate-pulse text-zinc-400">Loading story...</div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0510] gap-4">
                <h1 className="text-2xl text-white">Blog not found</h1>
                <Link href="/" className="text-purple-400 hover:underline">Go Home</Link>
            </div>
        );
    }

    return (
        <article className="min-h-screen relative" style={{ backgroundColor: '#0a0510' }}>
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, rgba(91,33,182,0.2) 0%, transparent 70%)', filter: 'blur(100px)' }} />
                <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
                    style={{ background: 'radial-gradient(circle, rgba(30,58,138,0.2) 0%, transparent 70%)', filter: 'blur(100px)' }} />
            </div>

            {/* Dark Hero Section */}
            <div className="relative z-10 pt-28 pb-24 md:pt-32 md:pb-28 px-6">
                <div className="max-w-4xl mx-auto">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-purple-300 transition-colors mb-8 group text-sm"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Articles
                    </Link>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        {blog.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                        {blog.type && (
                            <span className="px-3 py-1 rounded-full bg-purple-500/15 text-purple-300 font-medium border border-purple-500/20">
                                {blog.type}
                            </span>
                        )}
                        <span className="flex items-center gap-2"><User size={15} /> {blog.author || "Admin"}</span>
                        <span className="flex items-center gap-2"><Calendar size={15} /> {formatDate(blog.created_at)}</span>
                        <span className="flex items-center gap-2"><Clock size={15} /> {calculateReadTime(blog.content)}</span>
                    </div>
                </div>
            </div>

            {/* Light Reading Card */}
            <div className="relative z-10 -mt-12 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="max-w-4xl mx-auto bg-slate-50 rounded-2xl md:rounded-3xl shadow-2xl shadow-black/50 overflow-hidden"
                >
                    {/* Cover Image inside card */}
                    {blog.cover_image ? (
                        <div className="relative aspect-video w-full overflow-hidden">
                            <img
                                src={blog.cover_image?.startsWith('http') ? blog.cover_image : `${backendBase}${blog.cover_image}`}
                                alt={blog.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-purple-100 to-slate-100 flex items-center justify-center">
                            <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500 opacity-30">
                                {blog.type || "Story"}
                            </span>
                        </div>
                    )}

                    {/* Article Content */}
                    <div className="p-6 sm:p-8 md:p-12">
                        <div
                            className="prose prose-lg md:prose-xl max-w-none leading-relaxed
                                       prose-headings:text-slate-900 prose-headings:font-bold
                                       prose-p:text-slate-800 prose-li:text-slate-800
                                       prose-a:text-purple-600 hover:prose-a:text-purple-500
                                       prose-strong:text-slate-900 prose-code:text-purple-600
                                       prose-blockquote:text-slate-600
                                       prose-img:rounded-xl"
                            style={{ color: '#1e293b' }}
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                    </div>
                </motion.div>
            </div>
        </article>
    );
}