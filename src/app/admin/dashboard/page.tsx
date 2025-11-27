"use client";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import { getToken } from "@/utils/auth";

interface Blog {
  _id: string;
  title: string;
}

export default function Dashboard() {
  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api
        .get("/blogs", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setBlogs(res.data));
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {blogs.map((b) => (
        <div key={b._id} className="border-b py-2">{b.title}</div>
      ))}
    </div>
  );
}
