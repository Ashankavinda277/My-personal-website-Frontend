export const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown Date";
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

export const calculateReadTime = (content?: string) => {
    if (!content) return "1 min read";
    const words = content.split(/\s+/).length;
    if (words < 100) return "Less than 1 min read";
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
};
