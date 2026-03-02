"use client";

import React, { useState } from "react";
import api from "../../../utils/api";
import { setToken } from "../../../utils/auth";
import { useRouter } from "next/navigation";

export default function AdminRegister() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post("/auth/register", { username, password });
      // auto-login
      const res = await api.post("/auth/login", { username, password });
      const t = res.data.access_token;
      setToken(t);
      setMessage("Registered and logged in");
      router.push("/admin");
    } catch (err: any) {
      console.error(err);
      setMessage(err?.response?.data?.detail ?? "Registration failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 pt-24">
      <div className="max-w-md w-full bg-zinc-900/50 border border-white/10 p-8 rounded-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Register Admin</h1>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <input 
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
            placeholder="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button 
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Register
          </button>
        </form>
        {message && <div className="mt-4 p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg text-white text-center">{message}</div>}
      </div>
    </div>
  );
}
