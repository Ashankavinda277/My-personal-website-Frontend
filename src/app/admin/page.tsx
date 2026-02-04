"use client";

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { getToken, removeToken } from "../../utils/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, LogOut, LayoutDashboard, Image as ImageIcon, Type, Trash2, Loader2, UserPlus } from "lucide-react";

type BlogItem = { _id?: string; id?: string; title: string; content?: string; type?: string };

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);

  // State for categories (full objects now)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // Form States
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Category Form States
  const [newCatName, setNewCatName] = useState("");
  const [newCatImage, setNewCatImage] = useState<File | null>(null);

  // Inline Editing State
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [tempCatName, setTempCatName] = useState("");

  const [msg, setMsg] = useState("");
  const [catMsg, setCatMsg] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      const [blogsRes, typesRes] = await Promise.all([
        api.get("/blogs"),
        api.get("/blogs/types").catch(() => ({ data: { items: [] } }))
      ]);

      const blogItems = blogsRes.data.items || blogsRes.data.blogs || blogsRes.data || [];
      setBlogs(Array.isArray(blogItems) ? blogItems : []);

      const typeItems = typesRes.data.items || [];
      setCategories(typeItems);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push("/auth/login");
  };



  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    try {
      const form = new FormData();
      if (title) form.append("title", title);
      if (content) form.append("content", content);

      // Use custom type if selected "other" or typed something
      const finalType = customType || selectedType;
      if (finalType) form.append("type", finalType);

      if (coverFile) form.append("cover", coverFile);

      if (editingId) {
        await api.put(`/blogs/${editingId}`, form);
        setMsg("Blog updated successfully!");
        setEditingId(null);
      } else {
        await api.post("/blogs", form);
        setMsg("Blog published successfully!");
      }

      // Reset form
      setTitle("");
      setContent("");
      setCustomType("");
      setSelectedType("");
      setCoverFile(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      let errorMsg = "Failed to process request";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map(e => e.msg).join(", ");
        } else if (typeof detail === "object") {
          errorMsg = JSON.stringify(detail);
        }
      }
      setMsg(errorMsg);
    }
  };

  const handleEdit = (blog: BlogItem) => {
    setEditingId(blog._id || blog.id || null);
    setTitle(blog.title);
    setContent(blog.content || "");
    setSelectedType(blog.type || "");
    setCoverFile(null); // Can't ensure file exists, but simple editing checks out

    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setSelectedType("");
    setCustomType("");
    setCoverFile(null);
    setMsg("");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/blogs/${id}`);
      setBlogs(blogs.filter(b => (b._id || b.id) !== id));
    } catch (err) {
      alert("Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <Loader2 className="animate-spin text-purple-500" size={48} />
      </div>
    );
  }

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="flex items-center gap-2 mb-10 text-purple-400 font-bold text-xl">
          <LayoutDashboard /> Admin
        </div>

        <nav className="flex-1 space-y-2">
          <div className="sidebar-link sidebar-link-active">
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <Link href="/auth/secret-register" className="sidebar-link">
            <UserPlus size={18} /> Register New Admin
          </Link>
        </nav>

        <button
          onClick={handleLogout}
          className="sidebar-link text-gray-400 hover:text-red-400 mt-auto"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="admin-header">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <div className="md:hidden">
            <button onClick={handleLogout} className="text-red-400"><LogOut /></button>
          </div>
        </header>

        <div className="dashboard-grid">
          {/* Create/Edit Post Form */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Plus className={editingId ? "text-blue-500" : "text-purple-500"} />
                  {editingId ? "Edit Post" : "Create New Post"}
                </span>
                {editingId && (
                  <button onClick={handleCancelEdit} className="text-xs text-gray-400 hover:text-white underline">
                    Cancel Edit
                  </button>
                )}
              </h2>

              <form onSubmit={handleSubmitPost} className="space-y-4">
                <div>
                  <label className="form-label">Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input"
                    placeholder="Enter post title"
                  />
                </div>

                <div>
                  <label className="form-label">Content</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="form-textarea"
                    placeholder="Write your thoughts..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Category (Type)</label>
                    <div className="flex gap-2">
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="form-input flex-1"
                      >
                        <option value="">Select Type</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                      <input
                        placeholder="Or new..."
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="form-input w-1/3"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Cover Image</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="cover-upload"
                      />
                      <label
                        htmlFor="cover-upload"
                        className="file-label"
                      >
                        <ImageIcon size={18} /> {coverFile ? coverFile.name : (editingId ? "Update Cover (Optional)" : "Upload Cover")}
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className={editingId ? "btn-edit" : "btn-primary"}
                >
                  {editingId ? "Update Post" : "Publish Post"}
                </button>

                {msg && <p className={`text-center text-sm ${msg.includes("success") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}
              </form>
            </motion.div>



            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card"
            >
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Type className="text-purple-500" /> Manage Categories
              </h2>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {categories.length === 0 && <p className="text-gray-500 text-sm">No categories found.</p>}
                {categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          value={tempCatName}
                          onChange={(e) => setTempCatName(e.target.value)}
                          className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm text-white w-full focus:outline-none focus:border-purple-500"
                          autoFocus
                        />
                        <button
                          onClick={async () => {
                            if (tempCatName && tempCatName !== cat.name) {
                              try {
                                const form = new FormData();
                                form.append("new_type", tempCatName);
                                await api.put(`/blogs/types/${encodeURIComponent(cat.name)}`, form);
                                fetchData();
                                setEditingCatId(null);
                              } catch (e) {
                                alert("Failed to update");
                              }
                            } else {
                              setEditingCatId(null);
                            }
                          }}
                          className="p-1 px-2 bg-green-500/10 text-green-500 rounded hover:bg-green-500/20 text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="p-1 px-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium">{cat.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setTempCatName(cat.name);
                            }}
                            className="p-2 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                            title="Rename"
                          >
                            <span className="text-xs uppercase font-bold">Edit</span>
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm(`Delete category "${cat.name}"?`)) {
                                try {
                                  await api.delete(`/blogs/types/${encodeURIComponent(cat.name)}`);
                                  fetchData();
                                } catch (e) {
                                  alert("Failed to delete category");
                                }
                              }
                            }}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>




          {/* Existing Posts List */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card max-h-[800px] overflow-y-auto"
            >
              <h2 className="text-xl font-semibold mb-6">Recent Posts</h2>
              <div className="space-y-4">
                {blogs.length === 0 && <p className="text-gray-500 text-center">No posts yet.</p>}
                {blogs.map((blog) => (
                  <div key={blog._id || blog.id} className="list-item group">
                    <h3 className="font-medium text-white mb-1 line-clamp-1">{blog.title}</h3>
                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">{blog.content}</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="bg-white/5 px-2 py-1 rounded text-gray-400">{blog.type || "General"}</span>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEdit(blog)}
                          className="text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded"
                        >
                          <span className="text-[10px] uppercase font-bold tracking-wider">Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id || blog.id!)}
                          className="text-red-400 hover:text-red-300 bg-red-500/10 px-2 py-1 rounded transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
