import type { Metadata, ResolvingMetadata } from "next";

// Force dynamic rendering so Vercel CDN never caches stale metadata
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  
  const backendBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
  
  try {
    const res = await fetch(`${backendBase}/blogs/${id}`, { cache: 'no-store' });
    if (!res.ok) {
        return {};
    }
    const blog = await res.json();

    const previousImages = (await parent).openGraph?.images || [];
    let openGraphImages: any[] = previousImages;
    let twitterImages: any = undefined;

    if (blog.cover_image) {
        let url = blog.cover_image.startsWith('http') 
            ? blog.cover_image 
            : `${backendBase}${blog.cover_image}`;

        // LinkedIn doesn't reliably support WebP for OG image previews.
        // Convert Cloudinary WebP URLs to JPEG via URL transformation.
        if (url.includes('res.cloudinary.com') && url.endsWith('.webp')) {
            url = url.replace(/\.webp$/, '.jpg');
        }
            
        openGraphImages = [{
          url,
          width: 1200,
          height: 630,
          alt: blog.title,
        }];
        twitterImages = [url];
    }

    const title = `${blog.title} | Concepts`;
    let plainDescription = "Read this story on Concepts blog.";
    
    if (blog.content) {
        const stripped = blog.content.replace(/<[^>]*>?/igm, '');
        if (stripped.length > 0) {
            plainDescription = stripped.substring(0, 160).trim() + "...";
        }
    }

    return {
      title,
      description: plainDescription,
      openGraph: {
        title,
        description: plainDescription,
        images: openGraphImages,
        type: "article",
        publishedTime: blog.created_at,
        authors: [blog.author || "Admin"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description: plainDescription,
        images: twitterImages,
      },
    };
  } catch (error) {
    console.error("Error generating metadata for blog", id, error);
    return {};
  }
}

export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}