"use client";

import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { getToken, removeToken } from "../../utils/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, LogOut, LayoutDashboard, Image as ImageIcon, Type, Trash2, Loader2, UserPlus, Mail, User, Calendar, MessageSquare, Send, X } from "lucide-react";
import RichTextEditor from "../../components/RichTextEditor";

type BlogItem = { _id?: string; id?: string; title: string; content?: string; type?: string };

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submitted_at: string;
  status: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [activeTab, setActiveTab] = useState<"posts" | "messages">("posts");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const [repliedMessagesCount, setRepliedMessagesCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ContactMessage | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [messageFilter, setMessageFilter] = useState<"all" | "new" | "replied">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'blog' | 'category'; id: string; name?: string } | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [updateError, setUpdateError] = useState("");

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

  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessages();
    }
  }, [activeTab]);

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

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const response = await api.get("/contact/messages");
      const msgs = response.data.messages || [];
      
      // Sort messages: "new" first, then "replied", then others
      const sortedMsgs = msgs.sort((a: ContactMessage, b: ContactMessage) => {
        if (a.status === "new" && b.status !== "new") return -1;
        if (a.status !== "new" && b.status === "new") return 1;
        if (a.status === "replied" && b.status !== "replied" && b.status !== "new") return -1;
        if (a.status !== "replied" && b.status === "replied") return 1;
        return 0;
      });
      
      setMessages(sortedMsgs);
      
      // Count new and replied messages
      const newCount = msgs.filter((m: ContactMessage) => m.status === "new").length;
      const repliedCount = msgs.filter((m: ContactMessage) => m.status === "replied").length;
      setNewMessagesCount(newCount);
      setRepliedMessagesCount(repliedCount);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleReplyClick = (msg: ContactMessage) => {
    setReplyingTo(msg);
    setReplySubject(`Re: ${msg.subject}`);
    setReplyBody("");
  };

  const handleSendReply = async () => {
    if (!replyingTo || !replySubject || !replyBody) {
      setReplyError("Please fill in subject and message");
      setTimeout(() => setReplyError(""), 3000);
      return;
    }

    setSending(true);
    setReplyError("");
    try {
      const response = await api.post("/contact/reply", {
        message_id: replyingTo._id,
        reply_subject: replySubject,
        reply_body: replyBody
      });

      if (response.data.success) {
        setReplySuccess(true);
        setTimeout(() => {
          setReplyingTo(null);
          setReplySubject("");
          setReplyBody("");
          setReplySuccess(false);
        }, 2000);
        fetchMessages(); // Refresh messages to update status
      }
    } catch (error: any) {
      setReplyError(error.response?.data?.detail || error.message || "Failed to send email");
      setTimeout(() => setReplyError(""), 5000);
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push("/auth/login");
  };



  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");

    // Validate required fields
    if (!title || !title.trim()) {
      setMsg("Title is required");
      return;
    }
    if (!content || content.trim() === "" || content === "<p></p>") {
      setMsg("Content is required");
      return;
    }

    try {
      const form = new FormData();
      form.append("title", title);
      form.append("content", content);

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
      console.error("Full error:", err);
      console.error("Error response:", err.response);
      let errorMsg = "Failed to process request";
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          errorMsg = detail;
        } else if (Array.isArray(detail)) {
          errorMsg = detail.map(e => `${e.loc?.join('.')}: ${e.msg}`).join(", ");
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
    try {
      await api.delete(`/blogs/${id}`);
      setBlogs(blogs.filter(b => (b._id || b.id) !== id));
      setDeleteSuccess("Blog post deleted successfully");
      setTimeout(() => setDeleteSuccess(""), 3000);
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError("Failed to delete blog post");
      setTimeout(() => setDeleteError(""), 3000);
    }
  }

  const handleDeleteCategory = async (name: string) => {
    try {
      await api.delete(`/blogs/types/${encodeURIComponent(name)}`);
      fetchData();
      setDeleteSuccess("Category deleted successfully");
      setTimeout(() => setDeleteSuccess(""), 3000);
      setDeleteConfirm(null);
    } catch (err) {
      setDeleteError("Failed to delete category");
      setTimeout(() => setDeleteError(""), 3000);
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

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("posts")}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === "posts"
                ? "text-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <LayoutDashboard size={20} />
              Posts Management
              {blogs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500 rounded-full">
                  {blogs.length}
                </span>
              )}
            </div>
            {activeTab === "posts" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === "messages"
                ? "text-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <Mail size={20} />
              Contact Messages
              <div className="flex gap-1 ml-2">
                {newMessagesCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-green-500 text-white rounded-full" title="New messages">
                    {newMessagesCount} new
                  </span>
                )}
                {repliedMessagesCount > 0 && (
                  <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded-full" title="Replied messages">
                    {repliedMessagesCount} replied
                  </span>
                )}
              </div>
            </div>
            {activeTab === "messages" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>
        </div>

        {/* Posts Management Tab */}
        {activeTab === "posts" && (
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
                  <RichTextEditor
                    value={content}
                    onChange={(html) => setContent(html)}
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
                                setUpdateError("Failed to update category");
                                setTimeout(() => setUpdateError(""), 3000);
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
                            onClick={() => setDeleteConfirm({ type: 'category', id: cat.name, name: cat.name })}
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
                          onClick={() => setDeleteConfirm({ type: 'blog', id: blog._id || blog.id!, name: blog.title })}
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
        )}

        {/* Contact Messages Tab */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            {/* Filter Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setMessageFilter("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  messageFilter === "all"
                    ? "bg-purple-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                All Messages ({messages.length})
              </button>
              <button
                onClick={() => setMessageFilter("new")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  messageFilter === "new"
                    ? "bg-green-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                New ({newMessagesCount})
              </button>
              <button
                onClick={() => setMessageFilter("replied")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  messageFilter === "replied"
                    ? "bg-blue-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                Replied ({repliedMessagesCount})
              </button>
            </div>
            {loadingMessages ? (
              <div className="text-center py-12 text-gray-400">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No messages yet</p>
              </div>
            ) : messages.filter((msg) => {
                if (messageFilter === "all") return true;
                return msg.status === messageFilter;
              }).length === 0 ? (
              <div className="text-center py-12 glass-card">
                <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">
                  No {messageFilter === "new" ? "new" : "replied"} messages
                </p>
              </div>
            ) : (
              messages
                .filter((msg) => {
                  if (messageFilter === "all") return true;
                  return msg.status === messageFilter;
                })
                .map((msg) => (
                <motion.div
                  key={msg._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-6 hover:bg-white/5 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User size={18} className="text-purple-400" />
                        <h3 className="text-xl font-semibold">{msg.name}</h3>
                        <span
                          className={`px-3 py-1 text-xs rounded-full ${
                            msg.status === "new"
                              ? "bg-green-500/20 text-green-400"
                              : msg.status === "replied"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <Mail size={14} />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.email);
                            setCopiedEmail(msg.email);
                            setTimeout(() => setCopiedEmail(null), 2000);
                          }}
                          className="hover:text-purple-400 transition-colors cursor-pointer underline relative"
                          title="Click to copy email"
                        >
                          {msg.email}
                          {copiedEmail === msg.email && (
                            <span className="absolute -top-8 left-0 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              ✓ Copied!
                            </span>
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        {formatDate(msg.submitted_at)}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h4 className="text-lg font-medium text-purple-300 mb-2">
                      {msg.subject}
                    </h4>
                    <p className="text-gray-300 whitespace-pre-wrap bg-black/30 p-4 rounded-lg border border-white/5">
                      {msg.message}
                    </p>
                  </div>

                  {/* Reply Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleReplyClick(msg)}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Send size={16} />
                      Reply via Email
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {/* Reply Modal */}
        {replyingTo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full border border-white/10"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Reply to {replyingTo.name}</h3>
                  <p className="text-sm text-gray-400">{replyingTo.email}</p>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Subject</label>
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Message</label>
                  <textarea
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    rows={8}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Type your reply here..."
                  />
                </div>

                {/* Success/Error Messages */}
                {replySuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center"
                  >
                    ✅ Email sent successfully!
                  </motion.div>
                )}
                {replyError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center"
                  >
                    ❌ {replyError}
                  </motion.div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendReply}
                    disabled={sending || replySuccess}
                    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                    {sending ? "Sending..." : replySuccess ? "Sent!" : "Send Reply"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                Confirm Delete
              </h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete {deleteConfirm.type === 'blog' ? 'this blog post' : 'this category'}
                {deleteConfirm.name && <span className="font-semibold text-purple-400"> "{deleteConfirm.name}"</span>}?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === 'blog') {
                      handleDelete(deleteConfirm.id);
                    } else {
                      handleDeleteCategory(deleteConfirm.id);
                    }
                  }}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Toast Notifications */}
        {deleteSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            ✓ {deleteSuccess}
          </motion.div>
        )}
        {deleteError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            ❌ {deleteError}
          </motion.div>
        )}
        {updateError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50"
          >
            ❌ {updateError}
          </motion.div>
        )}
      </main>
    </div>
  );
}
