"use client";
import { useEffect, useState } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, calculateReadTime } from "../../utils/format";

interface Blog {
    _id?: string;
    id?: string;
    title: string;
    content?: string;
    cover_image?: string;
    type?: string;
    created_at?: string;
}

interface Category {
    id: string;
    name: string;
    image?: string;
}

export default function BlogPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtering & Pagination State
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


    const LIMIT = 15;
    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

    useEffect(() => {
        fetchTypes();
    }, []);

    useEffect(() => {
        fetchBlogs();
        // Scroll to top on page/filter change
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentPage, selectedType]);

    const fetchTypes = async () => {
        try {
            const res = await api.get("/blogs/types");
            setCategories(res.data.items || []);
        } catch (err) {
            console.error("Failed to fetch types:", err);
        }
    };

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            let url = `/blogs?page=${currentPage}&limit=${LIMIT}`;
            if (selectedType) {
                url += `&type=${encodeURIComponent(selectedType)}`;
            }

            const res = await api.get(url);
            const data = res.data;

            setBlogs(data.items || []);
            // Calculate total pages if backend returns total count
            if (data.total !== undefined) {
                setTotalPages(Math.ceil(data.total / LIMIT));
            } else {
                // Fallback if pages pre-calculated
                setTotalPages(data.pages || 1);
            }
        } catch (err) {
            console.error("Failed to fetch blogs:", err);
            setBlogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleTypeSelect = (typeName: string | null) => {
        setSelectedType(typeName);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white py-20 px-6">
            <div className="container mx-auto">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12 relative z-20"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        All <span className="text-purple-500">Stories</span>
                    </h1>

                    {/* Types Filter - Horizontal List */}
                    <div className="flex flex-nowrap justify-start gap-3 mt-8 pb-4 overflow-x-auto no-scrollbar mask-gradient">
                        <button
                            onClick={() => handleTypeSelect(null)}
                            className={`whitespace-nowrap px-6 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${!selectedType
                                ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-900/40'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'}`}
                        >
                            All Types
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleTypeSelect(cat.name)}
                                className={`whitespace-nowrap px-6 py-2 rounded-full border text-sm font-medium transition-all duration-300 ${selectedType === cat.name
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-900/40'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/30'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* Blog Grid */}
                {loading ? (
                    <div className="flex justify-center py-20 min-h-[400px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                ) : blogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-20 min-h-[400px]">
                        <p className="text-xl mb-2">No stories found.</p>
                        {selectedType && (
                            <button
                                onClick={() => handleTypeSelect(null)}
                                className="text-purple-400 hover:underline mt-2"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="blog-grid mb-16">
                            {blogs.map((blog, idx) => {
                                const key = blog._id ?? blog.id ?? idx;
                                const slug = blog._id ?? blog.id ?? String(idx);

                                return (
                                    <motion.div
                                        key={key}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="blog-card"
                                    >
                                        <Link href={`/blog/${slug}`} className="block h-full flex flex-col">
                                            {/* Image */}
                                            <div className="blog-image-wrapper">
                                                {blog.cover_image ? (
                                                    <img
                                                        src={blog.cover_image?.startsWith('http') ? blog.cover_image : `${backendBase}${blog.cover_image}`}
                                                        alt={blog.title}
                                                        className="blog-image"
                                                    />
                                                ) : (
                                                    <div className="blog-image-placeholder">
                                                        <span className="text-zinc-700 text-4xl font-bold opacity-20">Blog</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent opacity-60" />
                                            </div>

                                            {/* Content */}
                                            <div className="blog-content">
                                                <div className="blog-meta">
                                                    {blog.type && <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs">{blog.type}</span>}
                                                    <div className="blog-meta-item">
                                                        <Calendar size={12} />
                                                        {formatDate(blog.created_at)}
                                                    </div>
                                                    <div className="blog-meta-item">
                                                        <Clock size={12} />
                                                        {calculateReadTime(blog.content)}
                                                    </div>
                                                </div>

                                                <h3 className="blog-title">
                                                    {blog.title}
                                                </h3>

                                                <p className="blog-excerpt">
                                                    {blog.content}
                                                </p>

                                                <div className="read-more-link">
                                                    Read Article <ArrowRight size={16} />
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`p-3 rounded-lg border border-white/10 transition-colors ${currentPage === 1 ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`w-10 h-10 rounded-lg border font-bold transition-all ${currentPage === page
                                            ? 'bg-purple-600 border-purple-600 text-white scale-110 shadow-lg shadow-purple-900/50'
                                            : 'bg-transparent border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`p-3 rounded-lg border border-white/10 transition-colors ${currentPage === totalPages ? 'text-gray-600 cursor-not-allowed' : 'text-white hover:bg-white/10'}`}
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
