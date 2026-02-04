"use client";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-black text-white py-20 px-6">
            <div className="container mx-auto max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-4">
                        About <span className="text-purple-500">Concepts</span>
                    </h1>
                    <p className="text-gray-400 text-lg">The story behind the blog</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card leading-relaxed text-gray-300 space-y-6"
                >
                    <p>
                        Welcome to <strong>Concepts</strong>, a personal space dedicated to exploring ideas, sharing code, and documenting the journey of software development.
                    </p>
                    <p>
                        Started in 2024, this blog serves as a digital garden where I plant seeds of knowledge about modern web technologies, system architecture, and design patterns.
                    </p>
                    <p>
                        My goal is to create content that is not just informative but also visually engaging and easy to understand. Whether you're a beginner just starting out or a seasoned developer looking for new perspectives, I hope you find something valuable here.
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
