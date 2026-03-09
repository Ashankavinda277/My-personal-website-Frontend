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
            <div className="min-h-screen flex items-center justify-center text-black/60" style={{ backgroundColor: '#faf8ff' }}>
                <div className="animate-pulse">Loading story...</div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-black/60 gap-4" style={{ backgroundColor: '#faf8ff' }}>
                <h1 className="text-2xl text-black">Blog not found</h1>
                <Link href="/" className="text-purple-600 hover:underline">Go Home</Link>
            </div>
        );
    }

    return (
        <article className="min-h-screen text-black pb-64 pt-20 relative overflow-hidden" style={{ backgroundColor: '#faf8ff' }}>
            {/* Top purple glow wave */}
            <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none z-0">
                <svg viewBox="0 0 1440 320" className="absolute top-0 w-full" preserveAspectRatio="none" style={{ height: '100%' }}>
                    <defs>
                        <linearGradient id="purpleGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1a0540" stopOpacity="1" />
                            <stop offset="30%" stopColor="#2e1065" stopOpacity="1" />
                            <stop offset="60%" stopColor="#5b21b6" stopOpacity="0.85" />
                            <stop offset="100%" stopColor="#1a0540" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="purpleGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1a0540" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#2e1065" stopOpacity="0.65" />
                            <stop offset="100%" stopColor="#1a0540" stopOpacity="0.85" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#purpleGrad1)" d="M0,0 L0,160 Q180,220 360,180 Q540,140 720,190 Q900,240 1080,170 Q1260,100 1440,200 L1440,0 Z" />
                    <path fill="url(#purpleGrad2)" d="M0,0 L0,120 Q240,200 480,140 Q720,80 960,160 Q1200,240 1440,140 L1440,0 Z" />
                    <path fill="none" stroke="rgba(196,181,253,0.4)" strokeWidth="2" d="M0,130 Q240,210 480,150 Q720,90 960,170 Q1200,250 1440,150" />
                </svg>
                <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to top, #faf8ff, transparent)' }} />
            </div>

            {/* Left edge glow */}
            <div className="absolute top-0 left-0 w-72 pointer-events-none z-0"
                 style={{
                     bottom: '16rem',
                     background: 'linear-gradient(to right, rgba(26,5,64,0.6) 0%, rgba(46,16,101,0.3) 30%, rgba(91,33,182,0.1) 60%, transparent 100%)',
                     maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 90%, transparent 100%)',
                     WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 90%, transparent 100%)'
                 }} />
            {/* Right edge glow */}
            <div className="absolute top-0 right-0 w-72 pointer-events-none z-0"
                 style={{
                     bottom: '16rem',
                     background: 'linear-gradient(to left, rgba(26,5,64,0.6) 0%, rgba(46,16,101,0.3) 30%, rgba(91,33,182,0.1) 60%, transparent 100%)',
                     maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 90%, transparent 100%)',
                     WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 90%, transparent 100%)'
                 }} />

            {/* Header Section */}
            <div className="container mx-auto max-w-4xl px-6 mb-8 mt-8 relative z-10">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white font-medium hover:text-purple-200 transition-colors mb-8 group"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Articles
                </Link>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                    {blog.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-black/70">
                    {blog.type && (
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                            {blog.type}
                        </span>
                    )}
                    <span className="flex items-center gap-2"><User size={15} /> {blog.author || "Admin"}</span>
                    <span className="flex items-center gap-2"><Calendar size={15} /> {formatDate(blog.created_at)}</span>
                    <span className="flex items-center gap-2"><Clock size={15} /> {calculateReadTime(blog.content)}</span>
                </div>
            </div>

            {/* Hero Image */}
            <div className="container mx-auto max-w-4xl px-6 mb-12 relative z-10">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl md:rounded-3xl border border-purple-200/50 shadow-xl shadow-purple-200/20">
                    {blog.cover_image ? (
                        <img
                            src={blog.cover_image?.startsWith('http') ? blog.cover_image : `${backendBase}${blog.cover_image}`}
                            alt={blog.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-white select-none flex items-center justify-center">
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
                    <div
                        className="prose prose-lg md:prose-xl max-w-none leading-relaxed
                                   prose-headings:text-gray-900 prose-p:text-gray-900 prose-li:text-gray-900
                                   prose-a:text-purple-600 hover:prose-a:text-purple-500
                                   prose-strong:text-black prose-code:text-purple-600
                                   prose-blockquote:text-gray-800
                                   prose-img:rounded-xl prose-img:border prose-img:border-purple-100"
                        style={{ color: '#111111' }}
                        dangerouslySetInnerHTML={{ __html: processedContent }}
                    />
                </motion.div>
            </div>

            {/* Bottom purple glow wave - below all content */}
            <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none z-0">
                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" preserveAspectRatio="none" style={{ height: '100%', transform: 'rotate(180deg)' }}>
                    <defs>
                        <linearGradient id="purpleGrad3" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#1a0540" stopOpacity="1" />
                            <stop offset="40%" stopColor="#2e1065" stopOpacity="0.95" />
                            <stop offset="70%" stopColor="#5b21b6" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#1a0540" stopOpacity="1" />
                        </linearGradient>
                        <linearGradient id="purpleGrad4" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2e1065" stopOpacity="0.75" />
                            <stop offset="50%" stopColor="#1a0540" stopOpacity="0.55" />
                            <stop offset="100%" stopColor="#2e1065" stopOpacity="0.75" />
                        </linearGradient>
                    </defs>
                    <path fill="url(#purpleGrad3)" d="M0,0 L0,140 Q200,240 400,160 Q600,80 800,180 Q1000,280 1200,150 Q1350,80 1440,180 L1440,0 Z" />
                    <path fill="url(#purpleGrad4)" d="M0,0 L0,100 Q300,190 600,120 Q900,50 1200,160 Q1350,210 1440,130 L1440,0 Z" />
                    <path fill="none" stroke="rgba(221,214,254,0.45)" strokeWidth="2" d="M0,110 Q300,200 600,130 Q900,60 1200,170 Q1350,220 1440,140" />
                </svg>
                <div className="absolute top-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to bottom, #faf8ff, transparent)' }} />
            </div>
        </article>
    );
}
