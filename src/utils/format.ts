/**
 * Format date to human-readable string
 */
export function formatDate(dateString?: string): string {
    if (!dateString) return "Recently";

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

/**
 * Calculate estimated read time based on content
 */
export function calculateReadTime(content?: string): string {
    if (!content) return "1 min read";

    // Strip HTML tags for accurate word count
    const plainText = stripHtmlTags(content);
    const words = plainText.trim().split(/\s+/).length;
    const minutes = Math.ceil(words / 200); // Average reading speed: 200 words/min

    return `${minutes} min read`;
}

export function stripHtmlTags(html: string): string {
    if (!html) return "";

    // Remove HTML tags
    const withoutTags = html.replace(/<[^>]*>/g, " ");

    let decoded = withoutTags;
    // Decode HTML entities only on the client
    if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.innerHTML = withoutTags;
        decoded = textarea.value;
    }

    // Clean up extra whitespace
    return decoded.replace(/\s+/g, " ").trim();
}

/**
 * Get excerpt from HTML content (first N characters of plain text)
 */
export function getExcerpt(html: string, maxLength: number = 150): string {
    const plainText = stripHtmlTags(html);

    if (plainText.length <= maxLength) {
        return plainText;
    }

    // Truncate at word boundary
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");

    return lastSpace > 0
        ? truncated.substring(0, lastSpace) + "..."
        : truncated + "...";
}
