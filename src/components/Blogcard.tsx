"use client";
import { useEffect, useState } from "react";
import api from "../utils/api";
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

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Categories
  useEffect(() => {
    api.get("/blogs/types")
      .then(res => setCategories(res.data.items || []))
      .catch(err => console.error("Failed to fetch types", err));
  }, []);

  // Fetch Blogs (optionally filtered)
  useEffect(() => {
    setLoading(true);
    const endpoint = selectedCategory ? `/blogs?type=${encodeURIComponent(selectedCategory)}` : "/blogs";

    api
      .get(endpoint)
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setBlogs(data);
        } else if (Array.isArray(data?.items)) {
          setBlogs(data.items);
        } else if (Array.isArray(data?.blogs)) {
          setBlogs(data.blogs);
        } else {
          setBlogs([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch blogs:", err);
        setBlogs([]);
        setLoading(false);
      });
  }, [selectedCategory]);

  const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

  return (
    <section className="py-20 px-6 bg-black">
      <div className="container mx-auto">
        <motion.h2
          className="text-3xl md:text-4xl font-bold mb-12 text-center text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Latest <span className="text-purple-500">Stories</span>
        </motion.h2>

        {/* Categories Bar */}
        <div className="category-filter-bar">
          <div className="category-filter-wrapper">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`filter-btn ${selectedCategory === null ? "filter-btn-active" : "filter-btn-inactive"}`}
            >
              <span>All</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`filter-btn ${selectedCategory === cat.name ? "filter-btn-active" : "filter-btn-inactive"}`}
              >
                {/* Category Image Avatar */}
                {cat.image ? (
                  <img
                    src={cat.image.startsWith('http') ? cat.image : `${backendBase}${cat.image}`}
                    alt={cat.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                    {cat.name[0]}
                  </div>
                )}
                <span className="font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Blog Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No stories found for this category.
          </div>
        ) : (
          <div className="blog-grid">
            {blogs.map((b, idx) => {
              const key = b._id ?? b.id ?? idx;
              const slug = b._id ?? b.id ?? String(idx);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="blog-card"
                >
                  <Link href={`/blog/${slug}`} className="block h-full flex flex-col">
                    {/* Image Container */}
                    <div className="blog-image-wrapper">
                      {b.cover_image ? (
                        <img
                          src={b.cover_image?.startsWith('http') ? b.cover_image : `${backendBase}${b.cover_image}`}
                          alt={b.title}
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
                        {b.type && <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10">{b.type}</span>}
                        {/* Placeholder dates if not from API */}
                        <div className="blog-meta-item"><Calendar size={12} /> Today</div>
                        <div className="blog-meta-item"><Clock size={12} /> 5 min read</div>
                      </div>

                      <h3 className="blog-title">
                        {b.title}
                      </h3>

                      <p className="blog-excerpt">
                        {b.content}
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
        )}
      </div>
    </section>
  );
}
