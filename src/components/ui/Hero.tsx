"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
            {/* Background Gradient Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[128px] pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-6 backdrop-blur-sm">
                        Welcome to my personal space
                    </span>
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400 mb-6 tracking-tight">
                        Ideas in <br className="hidden md:block" />
                        <span className="text-white">Motion</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Exploring technology, design, and life. A curated collection of thoughts and stories by Ashan & Co.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/blog"
                            className="px-8 py-4 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors w-full sm:w-auto"
                        >
                            Read the Blog
                        </Link>
                        <Link
                            href="/about"
                            className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-semibold hover:bg-white/10 transition-colors w-full sm:w-auto backdrop-blur-sm"
                        >
                            About Me
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Scroll Down Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500"
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <div className="w-6 h-10 border-2 border-gray-500 rounded-full flex justify-center p-1">
                    <div className="w-1 h-2 bg-gray-500 rounded-full" />
                </div>
            </motion.div>
        </section>
    );
}
