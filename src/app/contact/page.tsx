"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send } from "lucide-react";

export default function ContactPage() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simulate submission
        setTimeout(() => setSubmitted(true), 1000);
    };

    return (
        <main className="min-h-screen bg-black text-white py-20 px-6">
            <div className="container mx-auto max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        Get in <span className="text-purple-500">Touch</span>
                    </h1>
                    <p className="text-gray-400 text-lg">Have a question or just want to say hi?</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card"
                >
                    {submitted ? (
                        <div className="text-center py-10">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 text-green-500 mb-4">
                                <Send size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
                            <p className="text-gray-400">Thanks for reaching out. I'll get back to you soon.</p>
                            <button
                                onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", message: "" }); }}
                                className="mt-6 text-purple-400 hover:text-purple-300 underline"
                            >
                                Send another message
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="form-input"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="form-label">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    className="form-input font-sans" // Override monospaced font from form-textarea if desired, or use form-textarea
                                    placeholder="Your message here..."
                                    value={formData.message}
                                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn-primary flex items-center justify-center gap-2"
                            >
                                <Mail size={18} /> Send Message
                            </button>
                        </form>
                    )}
                </motion.div>
            </div>
        </main>
    );
}
