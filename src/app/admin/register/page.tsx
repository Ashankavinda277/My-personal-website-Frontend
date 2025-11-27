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
    <div style={{ maxWidth: 640, margin: "32px auto", padding: 16 }}>
      <h1>Register Admin</h1>
      <form onSubmit={handleRegister} style={{ display: "grid", gap: 8 }}>
        <input placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input placeholder="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Register</button>
      </form>
      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}
