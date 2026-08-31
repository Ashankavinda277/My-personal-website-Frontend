import api from "./api";

/**
 * Images added with the toolbar button are uploaded to the backend and stored
 * as URLs. Images that arrive by pasting HTML (from Word, Google Docs, Notion,
 * a web page...) come in as `data:image/...;base64,...` and get embedded in the
 * article HTML itself, which inflates a post from a few KB to several MB.
 *
 * These helpers move those inline images out to real hosted URLs so the saved
 * content stays small — the same thing Medium does when you paste an image.
 */

/** Byte length of a string as it will be sent over the wire. */
export function byteLength(text: string): number {
    if (typeof TextEncoder === "undefined") return text.length;
    return new TextEncoder().encode(text).length;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Upload a File/Blob to the backend and return its hosted URL. */
export async function uploadImageFile(file: File | Blob, filename?: string): Promise<string> {
    const name = filename || (file instanceof File ? file.name : `image-${Date.now()}.png`);
    const form = new FormData();
    form.append("cover", file, name);

    const response = await api.post("/blogs/upload-image", form);
    const url = response.data?.url || response.data?.image_url;
    if (!url) throw new Error("Upload succeeded but no image URL was returned");
    return url;
}

/** Upload a `data:image/...;base64,...` URL and return its hosted URL. */
export async function uploadDataUrl(dataUrl: string): Promise<string> {
    const blob = await (await fetch(dataUrl)).blob();
    const extension = (blob.type.split("/")[1] || "png").split("+")[0];
    return uploadImageFile(blob, `pasted-${Date.now()}.${extension}`);
}

/**
 * Replace every inline base64 `<img>` in `html` with a hosted URL.
 * Returns the original html untouched when there is nothing to move.
 */
export async function externalizeInlineImages(html: string): Promise<string> {
    if (typeof window === "undefined" || !html || !html.includes("data:image/")) {
        return html;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const inlineImages = Array.from(doc.querySelectorAll<HTMLImageElement>('img[src^="data:image/"]'));
    if (inlineImages.length === 0) return html;

    // The same screenshot pasted twice should only be uploaded once.
    const uploaded = new Map<string, string>();

    for (const img of inlineImages) {
        const src = img.getAttribute("src");
        if (!src) continue;

        let url = uploaded.get(src);
        if (!url) {
            url = await uploadDataUrl(src);
            uploaded.set(src, url);
        }
        img.setAttribute("src", url);
    }

    return doc.body.innerHTML;
}

/** How many inline base64 images the content still carries. */
export function countInlineImages(html: string): number {
    if (!html) return 0;
    return (html.match(/src="data:image\//g) || []).length;
}
