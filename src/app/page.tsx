
import Hero from "@/components/ui/Hero";
import BlogList from "../components/Blogcard";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      <Hero />
      <div id="blog-section">
        <BlogList />
      </div>
    </main>
  );
}
