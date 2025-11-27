"use client";

import Link from "next/link";
import "../css/Navbar.css";

export default function Navbar() {
  return (
    <header className="row">
      <nav className="col1" aria-label="Primary">
        <Link href="/" className="link">Home</Link>
        <Link href="/About" className="link">About</Link>
        <Link href="/Blog" className="link">Blog</Link>
        <Link href="/Contact" className="link">Contact Us</Link>
        <Link href="/admin" className="link">Admin</Link>
      </nav>

      <div className="col2">
        <img
          src="/concepts-logo.png"
          alt="Concepts"
          className="logo"
        />
      </div>
    </header>
  );
}
