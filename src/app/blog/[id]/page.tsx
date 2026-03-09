"use client";

import { useEffect, useState, useMemo } from "react";
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

    // Pre-process blog HTML: move text boxes to the correct DOM position and apply float.
    // In the editor, dragging only changes visual CSS offset (data-x, data-y) — the node
    // stays at its original document position. So a text box created near the end but
    // dragged up to appear beside the features list is still at the bottom of the HTML.
    // We fix this by moving it up in the DOM by the right number of siblings, then floating it.
    const processedContent = useMemo(() => {
        if (!blog?.content) return '';
        if (typeof window === 'undefined') return blog.content;

        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div>${blog.content}</div>`, 'text/html');
        const container = doc.body.firstElementChild;
        if (!container) return blog.content;

        // Step 1: Collect all text boxes that need repositioning
        const textBoxes = Array.from(
            container.querySelectorAll('.text-box[data-x], .text-box-borderless[data-x]')
        );

        // Step 2: Remove all text boxes from the DOM first, so they don't
        // interfere with each other's index calculations
        const textBoxData: { el: HTMLElement; x: number; targetIndex: number }[] = [];
        textBoxes.forEach((textBox) => {
            const el = textBox as HTMLElement;
            const x = parseInt(el.getAttribute('data-x') || '0');
            const y = parseInt(el.getAttribute('data-y') || '0');
            const targetIndex = parseInt(el.getAttribute('data-target-index') || '-1');
            if (x === 0 && y === 0 && targetIndex < 0) return;

            // Apply float based on horizontal drag direction
            if (x > 0) {
                el.style.cssFloat = 'right';
                el.style.marginLeft = '1.5rem';
                el.style.marginBottom = '1rem';
            } else if (x < 0) {
                el.style.cssFloat = 'left';
                el.style.marginRight = '1.5rem';
                el.style.marginBottom = '1rem';
            }

            el.remove();
            textBoxData.push({ el, x, targetIndex });
        });

        // Step 3: Now the container has only content elements (no text boxes).
        // Sort by targetIndex DESCENDING so that inserting from highest to lowest
        // doesn't shift the positions of later insertions.
        textBoxData.sort((a, b) => b.targetIndex - a.targetIndex);
        textBoxData.forEach(({ el, targetIndex }) => {
            const contentChildren = Array.from(container.children);
            // Count only non-textbox, non-clearfix children to find the right position
            const contentOnly = contentChildren.filter(c => 
                !c.classList.contains('text-box') && 
                !c.classList.contains('text-box-borderless') &&
                !c.hasAttribute('data-clearfix')
            );
            if (targetIndex >= 0 && targetIndex < contentOnly.length) {
                container.insertBefore(el, contentOnly[targetIndex]);
            } else {
                container.appendChild(el);
            }
        });

        // Step 4: Add clearfix divs after text boxes to contain the float
        const floatedBoxes = container.querySelectorAll('.text-box, .text-box-borderless');
        floatedBoxes.forEach((box) => {
            const el = box as HTMLElement;
            if (!el.style.cssFloat) return;
            const clearDiv = doc.createElement('div');
            clearDiv.style.clear = 'both';
            clearDiv.setAttribute('data-clearfix', 'true');
            // Place clearfix 3 content siblings after the text box
            let boundary = el.nextElementSibling;
            let skip = 3;
            while (boundary && skip > 0) {
                if (!boundary.classList.contains('text-box') && 
                    !boundary.classList.contains('text-box-borderless') &&
                    !boundary.hasAttribute('data-clearfix')) {
                    skip--;
                }
                if (skip > 0) boundary = boundary.nextElementSibling;
            }
            if (boundary) {
                container.insertBefore(clearDiv, boundary);
            } else {
                container.appendChild(clearDiv);
            }
        });

        return container.innerHTML;
    }, [blog?.content]);

    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-300" style={{ backgroundColor: '#0f0f13' }}>
                <div className="animate-pulse">Loading story...</div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-300 gap-4" style={{ backgroundColor: '#0f0f13' }}>
                <h1 className="text-2xl">Blog not found</h1>
                <Link href="/" className="text-purple-400 hover:underline">Go Home</Link>
            </div>
        );
    }

    return (
        <article className="min-h-screen text-gray-300 pb-20 pt-20" style={{ backgroundColor: '#0f0f13' }}>
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
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />
                </motion.div>
            </div>
        </article>
    );
}
