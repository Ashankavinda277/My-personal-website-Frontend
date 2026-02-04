"use client";

import React from "react";
import { motion } from "framer-motion";
import { BookOpen, Users, Cpu, Activity, ArrowRight, Terminal, HeartPulse, Code2 } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="container mx-auto px-6">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-6">
                        About The Blog
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Simplifying complex concepts in IT, Medicine, and beyond to empower the next generation of professionals.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-16"
                >

                    {/* Mission */}
                    <motion.section variants={itemVariants} className="glass-card max-w-4xl mx-auto text-center p-10">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-purple-500/10 rounded-full">
                                <BookOpen size={40} className="text-purple-500" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                        <p className="text-gray-300 text-lg leading-relaxed">
                            We bridge the gap between complex theory and practical understanding.
                            We believe in <strong>Accessibility</strong>, <strong>Clarity</strong>, and <strong>Learning for All</strong>.
                        </p>
                    </motion.section>

                    {/* Story & Expertise */}
                    <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8">
                        <div className="glass-card p-8 border-l-4 border-blue-500">
                            <div className="flex items-center gap-3 mb-4">
                                <Cpu className="text-blue-500" size={28} />
                                <h3 className="text-2xl font-bold">Master your craft</h3>
                            </div>
                            <p className="text-gray-400">
                                Why struggle with dense textbooks and confusing tutorials alone? Join our community
                                of learners to get <strong>simplified breakdowns
                                    and exam-critical concepts</strong> delivered directly to you.
                            </p>
                        </div>
                        <div className="glass-card p-8 border-l-4 border-green-500">
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="text-green-500" size={28} />
                                <h3 className="text-2xl font-bold">Knowledge that fits your schedule.</h3>
                            </div>
                            <p className="text-gray-400">
                                We filter through the complexity to bring you high-value insights and "how-to" guides without the algorithm deciding what you see. Subscribe to ensure you never miss a deep dive into the topics that matter most to your education.
                            </p>
                        </div>
                    </motion.section>

                    {/* Who This Is For */}
                    <motion.section variants={itemVariants} className="bg-white/5 rounded-2xl p-8 md:p-12">
                        <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
                            <Users className="text-yellow-500" /> Who This Blog Is For
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="p-6 bg-black/40 rounded-xl hover:bg-black/60 transition-colors">
                                <h3 className="text-xl font-semibold mb-2 text-purple-400">IT Students</h3>
                                <p className="text-sm text-gray-400">Preparing for exams or building first systems like HRMS projects.</p>
                            </div>
                            <div className="p-6 bg-black/40 rounded-xl hover:bg-black/60 transition-colors">
                                <h3 className="text-xl font-semibold mb-2 text-green-400">Lifelong Learners</h3>
                                <p className="text-sm text-gray-400">Anyone looking for reliable, easy-to-digest biological and health concepts.</p>
                            </div>
                            <div className="p-6 bg-black/40 rounded-xl hover:bg-black/60 transition-colors">
                                <h3 className="text-xl font-semibold mb-2 text-pink-400">Career Switchers</h3>
                                <p className="text-sm text-gray-400">Understanding DevOps tools like Docker or Kubernetes from scratch.</p>
                            </div>
                        </div>
                    </motion.section>



                    {/* CTA */}
                    <motion.section variants={itemVariants} className="text-center py-12">
                        <div className="bg-gradient-to-tr from-purple-900/50 to-blue-900/50 rounded-3xl p-10 border border-white/10">
                            <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
                            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                                Don't just read—engage. Join our Discord for peer-to-peer learning or download our 'Exam-Ready' cheat sheets.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                                    Join Discord
                                </button>
                                <Link href="/blog" className="px-8 py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-colors font-medium">
                                    Explore The Blog
                                </Link>
                            </div>
                        </div>
                    </motion.section>

                </motion.div>
            </div>
        </div>
    );
}
