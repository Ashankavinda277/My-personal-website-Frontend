"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Code,
    Image as ImageIcon,
    Link as LinkIcon,
    AlignLeft,
    AlignCenter,
    AlignRight,
    Undo,
    Redo,
} from "lucide-react";
import { useCallback } from "react";
import api from "../utils/api";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            TextStyle,
            Color,
            Image.configure({
                inline: false,
                allowBase64: true,
                HTMLAttributes: {
                    class: "max-w-full h-auto rounded-lg my-4",
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: "text-purple-400 underline hover:text-purple-300",
                },
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3",
            },
        },
    });

    const addImage = useCallback(async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (!file || !editor) return;

            try {
                // Show loading state in editor (optional)
                console.log("Uploading image...", file.name);

                // Upload to backend using api utility (handles auth automatically)
                const formData = new FormData();
                formData.append("cover", file);

                const response = await api.post("/blogs/upload-image", formData);
                const data = response.data;
                const imageUrl = data.url || data.image_url;

                if (imageUrl) {
                    console.log("Image uploaded successfully:", imageUrl);
                    // Insert image using insertContent for better compatibility
                    editor.chain().focus().insertContent({
                        type: 'image',
                        attrs: {
                            src: imageUrl,
                        },
                    }).run();
                } else {
                    throw new Error("No URL returned from server");
                }
            } catch (error) {
                console.error("Image upload failed:", error);
                alert(`Image upload failed: ${error instanceof Error ? error.message : "Unknown error"}\n\nPlease check:\n1. You're logged in as admin\n2. Backend server is running\n3. Cloudinary is configured (or local uploads enabled)`);
                // Fallback to URL prompt
                const url = prompt("Enter image URL instead:");
                if (url && editor) {
                    editor.chain().focus().insertContent({
                        type: 'image',
                        attrs: {
                            src: url,
                        },
                    }).run();
                }
            }
        };
        input.click();
    }, [editor]);

    const setLink = useCallback(() => {
        if (!editor) return;
        const previousUrl = editor.getAttributes("link").href;
        const url = prompt("Enter URL:", previousUrl);

        if (url === null) return;
        if (url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
            return;
        }

        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-white/10 rounded-lg bg-black/20 overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-white/5">
                {/* Text Formatting */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`toolbar-btn ${editor.isActive("bold") ? "is-active" : ""}`}
                    title="Bold"
                >
                    <Bold size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`toolbar-btn ${editor.isActive("italic") ? "is-active" : ""}`}
                    title="Italic"
                >
                    <Italic size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`toolbar-btn ${editor.isActive("underline") ? "is-active" : ""}`}
                    title="Underline"
                >
                    <UnderlineIcon size={16} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Headings */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`toolbar-btn ${editor.isActive("heading", { level: 1 }) ? "is-active" : ""}`}
                    title="Heading 1"
                >
                    <Heading1 size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`toolbar-btn ${editor.isActive("heading", { level: 2 }) ? "is-active" : ""}`}
                    title="Heading 2"
                >
                    <Heading2 size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`toolbar-btn ${editor.isActive("heading", { level: 3 }) ? "is-active" : ""}`}
                    title="Heading 3"
                >
                    <Heading3 size={16} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Lists */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`toolbar-btn ${editor.isActive("bulletList") ? "is-active" : ""}`}
                    title="Bullet List"
                >
                    <List size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`toolbar-btn ${editor.isActive("orderedList") ? "is-active" : ""}`}
                    title="Numbered List"
                >
                    <ListOrdered size={16} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Alignment */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("left").run()}
                    className={`toolbar-btn ${editor.isActive({ textAlign: "left" }) ? "is-active" : ""}`}
                    title="Align Left"
                >
                    <AlignLeft size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("center").run()}
                    className={`toolbar-btn ${editor.isActive({ textAlign: "center" }) ? "is-active" : ""}`}
                    title="Align Center"
                >
                    <AlignCenter size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setTextAlign("right").run()}
                    className={`toolbar-btn ${editor.isActive({ textAlign: "right" }) ? "is-active" : ""}`}
                    title="Align Right"
                >
                    <AlignRight size={16} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Code Block */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`toolbar-btn ${editor.isActive("codeBlock") ? "is-active" : ""}`}
                    title="Code Block"
                >
                    <Code size={16} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Link & Image */}
                <button
                    type="button"
                    onClick={setLink}
                    className={`toolbar-btn ${editor.isActive("link") ? "is-active" : ""}`}
                    title="Add Link"
                >
                    <LinkIcon size={16} />
                </button>
                <button
                    type="button"
                    onClick={addImage}
                    className="toolbar-btn"
                    title="Add Image"
                >
                    <ImageIcon size={16} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Undo/Redo */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    className="toolbar-btn"
                    disabled={!editor.can().undo()}
                    title="Undo"
                >
                    <Undo size={16} />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    className="toolbar-btn"
                    disabled={!editor.can().redo()}
                    title="Redo"
                >
                    <Redo size={16} />
                </button>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} placeholder={placeholder} />
        </div>
    );
}
