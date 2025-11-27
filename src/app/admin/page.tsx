"use client";

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { getToken, setToken, removeToken } from "../../utils/auth";
import Link from "next/link";

type BlogItem = { id?: string; title: string; content?: string };

export default function AdminPage() {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  async function fetchBlogs() {
    try {
      setLoading(true);
      const res = await api.get("/blogs");
      setBlogs(res.data.items ?? []);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { username, password });
      const t = res.data.access_token;
      setToken(t);
      setTokenState(t);
      setMessage("Login successful");
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.detail ?? "Login failed");
    }
  }

  function doLogout() {
    removeToken();
    setTokenState(null);
    setMessage("Logged out");
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/blogs", { title, content });
      setMessage(`Created blog id ${res.data.id}`);
      setTitle("");
      setContent("");
      await fetchBlogs();
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.detail ?? "Failed to create blog");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: 16 }}>
      <h1>Admin Dashboard</h1>

      <div style={{ marginBottom: 20 }}>
        {token ? (
          <div>
            <div style={{ marginBottom: 8 }}>You are logged in as admin.</div>
            <button onClick={doLogout}>Logout</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit">Login</button>
            <Link href="/admin/register" style={{ marginLeft: 12 }}>Register admin</Link>
          </form>
        )}
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2>Create Blog (admin only)</h2>
        {token ? (
          <form onSubmit={handlePost} style={{ display: "grid", gap: 8 }}>
            <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Content" value={content} onChange={(e) => setContent(e.target.value)} rows={8} />
            <button type="submit">Publish</button>
          </form>
        ) : (
          <div>Please log in as an admin to create blogs.</div>
        )}
      </section>

      <section>
        <h2>All blogs</h2>
        {loading ? (
          <div>Loading…</div>
        ) : (
          <ul>
            {blogs.map((b) => (
              <li key={b.id} style={{ marginBottom: 12 }}>
                <strong>{b.title}</strong>
                <div style={{ color: "#444" }}>{(b.content ?? "").slice(0, 180)}{(b.content || "").length > 180 ? '…' : ''}</div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {message && <div style={{ marginTop: 20, color: "#0a0" }}>{message}</div>}
    </div>
  );
}

