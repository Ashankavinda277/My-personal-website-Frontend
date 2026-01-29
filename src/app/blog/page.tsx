"use client";
import { useEffect, useState } from "react";
import api from "../../utils/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";

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
    const [categories, setCategories] = useState<Category[]>([]);
    const [blogsByCategory, setBlogsByCategory] = useState<Record<string, Blog[]>>({});
    const [loading, setLoading] = useState(true);

    const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            // Fetch categories
            const categoriesRes = await api.get("/blogs/types");
            const cats = categoriesRes.data.items || [];
            setCategories(cats);

            // Fetch blogs for each category
            const blogsData: Record<string, Blog[]> = {};

            for (const cat of cats) {
                const blogsRes = await api.get(`/blogs?type=${encodeURIComponent(cat.name)}`);
                const blogs = blogsRes.data.items || blogsRes.data.blogs || blogsRes.data || [];
                blogsData[cat.name] = Array.isArray(blogs) ? blogs : [];
            }

            setBlogsByCategory(blogsData);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white py-20 px-6">
            <div className="container mx-auto">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        All <span className="text-purple-500">Stories</span>
                    </h1>
                    <p className="text-gray-400 text-lg">Explore posts organized by category</p>
                </motion.div>

                {/* Category Sections */}
                <div className="space-y-20">
                    {categories.map((category, catIdx) => {
                        const posts = blogsByCategory[category.name] || [];

                        if (posts.length === 0) return null;

                        return (
                            <motion.section
                                key={category.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: catIdx * 0.1 }}
                            >
                                {/* Category Header */}
                                <div className="category-section-header">
                                    {category.image ? (
                                        <img
                                            src={category.image.startsWith('http') ? category.image : `${backendBase}${category.image}`}
                                            alt={category.name}
                                            className="category-avatar"
                                        />
                                    ) : (
                                        <div className="category-avatar-placeholder">
                                            {category.name[0]}
                                        </div>
                                    )}
                                    <div>
                                        <h2 className="category-title">{category.name}</h2>
                                        <p className="text-gray-400">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
                                    </div>
                                </div>

                                {/* Posts Grid */}
                                <div className="blog-grid">
                                    {posts.map((blog, idx) => {
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
                                                            <div className="blog-meta-item"><Calendar size={12} /> Today</div>
                                                            <div className="blog-meta-item"><Clock size={12} /> 5 min read</div>
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
                            </motion.section>
                        );
                    })}
                </div>

                {/* Empty State */}
                {categories.length === 0 && (
                    <div className="text-center text-gray-500 py-20">
                        <p className="text-xl mb-2">No categories found.</p>
                        <p className="text-sm">Create some categories and posts in the admin dashboard!</p>
                    </div>
                )}
            </div>
        </main>
    );
}
