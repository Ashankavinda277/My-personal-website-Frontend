"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Github, Linkedin, MessageSquare, Send, User, AtSign, FileText } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate form submission
        alert("Thanks for reaching out! This is a demo form.");
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 flex items-center">
            <div className="container mx-auto px-6">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-12 text-center">
                        Get in Touch
                    </h1>

                    <div className="grid md:grid-cols-2 gap-12 items-start">

                        {/* Left Column: The Why */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-8"
                        >
                            <div className="glass-card p-8 border-l-4 border-purple-500">
                                <h2 className="text-3xl font-bold mb-4">Let's Learn Together</h2>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Have a question about a complex IT concept? Want to request a specific topic breakdown?
                                    Or just want to chat about the latest in tech and medicine?
                                </p>
                                <p className="text-gray-400 text-lg leading-relaxed mt-4">
                                    Your feedback shapes this community. Reach out through any of the channels below!
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Link href="https://github.com" target="_blank" className="p-4 glass-card flex items-center gap-3 hover:bg-white/10 transition-colors group">
                                    <Github className="text-gray-400 group-hover:text-white transition-colors" />
                                    <span className="font-medium text-gray-300 group-hover:text-white">GitHub</span>
                                </Link>
                                <Link href="https://linkedin.com" target="_blank" className="p-4 glass-card flex items-center gap-3 hover:bg-white/10 transition-colors group">
                                    <Linkedin className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                                    <span className="font-medium text-gray-300 group-hover:text-white">LinkedIn</span>
                                </Link>
                                <Link href="#" className="p-4 glass-card flex items-center gap-3 hover:bg-white/10 transition-colors group">
                                    <MessageSquare className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                                    <span className="font-medium text-gray-300 group-hover:text-white">Discord</span>
                                </Link>
                                <Link href="mailto:hello@example.com" className="p-4 glass-card flex items-center gap-3 hover:bg-white/10 transition-colors group">
                                    <Mail className="text-pink-400 group-hover:text-pink-300 transition-colors" />
                                    <span className="font-medium text-gray-300 group-hover:text-white">Email</span>
                                </Link>
                            </div>
                        </motion.div>

                        {/* Right Column: The How (Form) */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="glass-card p-8 md:p-10"
                        >
                            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <Send size={24} className="text-purple-500" />
                                Send a Message
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-6">

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 flex items-center gap-2">
                                        <User size={16} /> Name
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 flex items-center gap-2">
                                        <AtSign size={16} /> Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 flex items-center gap-2">
                                        <FileText size={16} /> Subject
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                                        placeholder="What's this about?"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 flex items-center gap-2">
                                        <MessageSquare size={16} /> Message
                                    </label>
                                    <textarea
                                        className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all min-h-[150px]"
                                        placeholder="Your message here..."
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                                >
                                    <Send size={18} /> Send Message
                                </button>
                            </form>
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
