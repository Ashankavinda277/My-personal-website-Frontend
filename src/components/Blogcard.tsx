"use client";
import { useEffect, useState } from "react";
import api from "../utils/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { formatDate, calculateReadTime, getExcerpt } from "../utils/format";

interface Blog {
  _id?: string;
  id?: string;
  title: string;
  content?: string;
  cover_image?: string;
  type?: string;
  created_at?: string;
}

export default function BlogList() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch 6 recent blogs
  useEffect(() => {
    setLoading(true);
    api
      .get("/blogs?limit=6")
      .then((res) => {
        const data = res.data;
        if (Array.isArray(data)) {
          setBlogs(data);
        } else if (Array.isArray(data?.items)) {
          setBlogs(data.items);
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
  }, []);

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

        {/* Blog Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No stories found.
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
                  className="blog-card-horizontal"
                >
                  <Link href={`/blog/${slug}`} className="block h-full">
                    <div className="flex gap-6 h-full">
                      {/* Content - Left Side (70%) */}
                      <div className="flex-1 flex flex-col justify-between">
                        {/* Category Badge */}
                        {b.type && (
                          <div className="mb-3">
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-purple-400">
                              {b.type}
                            </span>
                          </div>
                        )}

                        {/* Title - Large and Prominent */}
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 line-clamp-2 hover:text-purple-400 transition-colors">
                          {b.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-gray-400 text-base mb-4 line-clamp-2 flex-grow">
                          {getExcerpt(b.content || "", 150)}
                        </p>

                        {/* Meta Info + Read More */}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              {formatDate(b.created_at)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={14} />
                              {calculateReadTime(b.content)}
                            </div>
                          </div>

                          <div className="text-purple-400 text-sm flex items-center gap-1 hover:gap-2 transition-all">
                            Read Article <ArrowRight size={16} />
                          </div>
                        </div>
                      </div>

                      {/* Image - Right Side (30%) */}
                      <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-900 relative">
                        {b.cover_image ? (
                          <img
                            src={b.cover_image?.startsWith('http') ? b.cover_image : `${backendBase}${b.cover_image}`}
                            alt={b.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800/50">
                            <span className="text-zinc-700 text-2xl font-bold opacity-20">Blog</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* View All Button */}
        <div className="flex justify-center mt-12">
          <Link
            href="/blog"
            className="group flex items-center gap-2 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white transition-all hover:scale-105 active:scale-95 backdrop-blur-sm"
          >
            View All Stories
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
