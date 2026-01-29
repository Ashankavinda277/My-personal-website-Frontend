"use client";

import { useState } from "react";
import api from "../../../utils/api";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SecretRegister() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [msg, setMsg] = useState("");
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post("/auth/register", { username, password });
            setMsg("Registration successful! Redirecting to login...");
            setTimeout(() => router.push("/auth/login"), 2000);
        } catch (err: any) {
            setMsg(err.response?.data?.detail || "Registration failed");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-zinc-900/50 border border-white/10 p-8 rounded-2xl backdrop-blur-xl"
            >
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Secret Registration</h2>
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                        <input
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg transition-all mt-2"
                    >
                        Create Admin Account
                    </button>
                </form>
                {msg && <p className="mt-4 text-center text-sm text-purple-300">{msg}</p>}
            </motion.div>
        </div>
    );
}
