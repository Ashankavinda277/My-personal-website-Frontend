"use client";
import { useEffect, useState } from "react";
import api from "../utils/api";
import Link from "next/link";

interface Blog {
  _id?: string;
  id?: string;
  title: string;
  content?: string;
}

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    api
      .get("/blogs")
      .then((res) => {
        console.log("GET /blogs response:", res.data);
        const data = res.data;
        if (Array.isArray(data)) {
          setBlogs(data);
        } else if (Array.isArray(data?.items)) {
          setBlogs(data.items);
        } else if (Array.isArray(data?.blogs)) {
          setBlogs(data.blogs);
        } else {
          setBlogs([]);
          console.warn("Unexpected /blogs response shape, using empty list.");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch blogs:", err);
        setBlogs([]);
      });
  }, []);

  return (
    
    <div className="p-6 max-w-3xl mx-auto">
  
      <h1 className="text-3xl font-bold mb-4">My Blog</h1>
      {blogs.map((b, idx) => {
        const key = b._id ?? b.id ?? idx;
        const slug = b._id ?? b.id ?? String(idx);
        return (
          <div key={key} className="border-b py-2">
            <Link href={`/blog/${slug}`}>
              <h2 className="text-xl font-semibold hover:underline">{b.title}</h2>
            </Link>
            <p className="text-gray-600">{(b.content ?? "").slice(0, 120)}...</p>
          </div>
        );
      })}
    </div>
  );
}
