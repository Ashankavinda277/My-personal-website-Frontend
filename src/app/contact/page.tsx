"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Facebook, Send, User, AtSign, FileText, MessageSquare, Copy, Check } from "lucide-react";
import Link from "next/link";
import api from "@/utils/api";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [emailCopied, setEmailCopied] = useState(false);

    const handleEmailClick = () => {
        const email = "concepts.update@gmail.com";
        
        // Try opening mailto, but also copy to clipboard as fallback
        navigator.clipboard.writeText(email).then(() => {
            setEmailCopied(true);
            setTimeout(() => setEmailCopied(false), 2000);
        });
        
        // Also try mailto
        window.location.href = `mailto:${email}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitStatus("idle");
        setErrorMessage("");

        try {
            const response = await api.post("/contact/submit", formData);
            
            if (response.data.success) {
                setSubmitStatus("success");
                setFormData({ name: "", email: "", subject: "", message: "" });
                
                // Reset success message after 5 seconds
                setTimeout(() => setSubmitStatus("idle"), 5000);
            }
        } catch (error: any) {
            console.error("Error submitting form:", error);
            setSubmitStatus("error");
            setErrorMessage(error.response?.data?.detail || "Failed to send message. Please try again.");
            
            // Reset error message after 5 seconds
            setTimeout(() => setSubmitStatus("idle"), 5000);
        } finally {
            setIsSubmitting(false);
        }
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

                            <div className="grid grid-cols-2 gap-4 max-w-md">
                                <Link href="https://facebook.com/ConceptsBlog" target="_blank" className="p-4 glass-card flex items-center gap-3 hover:bg-white/10 transition-colors group">
                                    <Facebook className="text-blue-500 group-hover:text-blue-400 transition-colors" />
                                    <span className="font-medium text-gray-300 group-hover:text-white">Facebook</span>
                                </Link>
                                <button 
                                    onClick={handleEmailClick}
                                    className="p-4 glass-card flex items-center gap-3 hover:bg-white/10 transition-colors group cursor-pointer relative"
                                >
                                    {emailCopied ? (
                                        <Check className="text-green-400 transition-colors" />
                                    ) : (
                                        <Mail className="text-pink-400 group-hover:text-pink-300 transition-colors" />
                                    )}
                                    <span className="font-medium text-gray-300 group-hover:text-white">
                                        {emailCopied ? "Copied!" : "Email"}
                                    </span>
                                </button>
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
                                    disabled={isSubmitting}
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send size={18} /> 
                                    {isSubmitting ? "Sending..." : "Send Message"}
                                </button>

                                {/* Success/Error Messages */}
                                {submitStatus === "success" && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-center"
                                    >
                                        ✅ Message sent successfully! We'll get back to you soon.
                                    </motion.div>
                                )}
                                {submitStatus === "error" && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-center"
                                    >
                                        ❌ {errorMessage}
                                    </motion.div>
                                )}
                            </form>
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </div>
    );
}
