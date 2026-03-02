"use client";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import { getToken } from "@/utils/auth";
import { Mail, MessageSquare, Calendar, User, FileText, Check, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface Blog {
  _id: string;
  title: string;
}

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  submitted_at: string;
  status: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"blogs" | "messages">("messages");
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      api
        .get("/blogs", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setBlogs(res.data))
        .catch((err) => console.error("Failed to fetch blogs:", err));
    }
  }, []);

  useEffect(() => {
    if (activeTab === "messages") {
      fetchMessages();
    }
  }, [activeTab]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await api.get("/contact/messages");
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    // Backend stores in UTC, convert to local timezone
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-24">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">Manage your blog and contact messages</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
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
              {messages.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500 rounded-full">
                  {messages.length}
                </span>
              )}
            </div>
            {activeTab === "messages" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("blogs")}
            className={`px-6 py-3 font-medium transition-all relative ${
              activeTab === "blogs"
                ? "text-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText size={20} />
              Blogs
              {blogs.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-purple-500 rounded-full">
                  {blogs.length}
                </span>
              )}
            </div>
            {activeTab === "blogs" && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === "messages" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-400">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <MessageSquare size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No messages yet</p>
              </div>
            ) : (
              messages.map((msg) => (
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
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {msg.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                        <Mail size={14} />
                        <a
                          href={`mailto:${msg.email}`}
                          className="hover:text-purple-400 transition-colors"
                        >
                          {msg.email}
                        </a>
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
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === "blogs" && (
          <div className="space-y-2">
            {blogs.length === 0 ? (
              <div className="text-center py-12 glass-card">
                <FileText size={48} className="mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400">No blogs yet</p>
              </div>
            ) : (
              blogs.map((b) => (
                <div
                  key={b._id}
                  className="glass-card p-4 hover:bg-white/5 transition-colors"
                >
                  {b.title}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
