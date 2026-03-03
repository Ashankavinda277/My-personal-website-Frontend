"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Extension, Node } from "@tiptap/core";
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
    ChevronDown,
    Type,
} from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import api from "../utils/api";

// Font Size Extension
const FontSize = Extension.create({
    name: "fontSize",

    addOptions() {
        return {
            types: ["textStyle"],
        };
    },

    addGlobalAttributes() {
        return [
            {
                types: this.options.types,
                attributes: {
                    fontSize: {
                        default: null,
                        parseHTML: (element) =>
                            element.style.fontSize?.replace(/['"]+/g, ""),
                        renderHTML: (attributes) => {
                            if (!attributes.fontSize) {
                                return {};
                            }
                            return {
                                style: `font-size: ${attributes.fontSize}`,
                            };
                        },
                    },
                },
            },
        ];
    },

    addCommands() {
        return {
            setFontSize:
                (fontSize: string) =>
                    ({ chain }) => {
                        return chain().setMark("textStyle", { fontSize }).run();
                    },
            unsetFontSize:
                () =>
                    ({ chain }) => {
                        return chain()
                            .setMark("textStyle", { fontSize: null })
                            .removeEmptyTextStyle()
                            .run();
                    },
        };
    },
});

// Custom BulletList extension that supports class attribute
const CustomBulletList = BulletList.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            class: {
                default: "list-disc",
                parseHTML: element => element.getAttribute('class'),
                renderHTML: attributes => {
                    return {
                        class: attributes.class,
                    };
                },
            },
        };
    },
});

// Custom OrderedList extension that supports class attribute
const CustomOrderedList = OrderedList.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            class: {
                default: "list-decimal",
                parseHTML: element => element.getAttribute('class'),
                renderHTML: attributes => {
                    return {
                        class: attributes.class,
                    };
                },
            },
        };
    },
});

// Resizable Image Component
const ResizableImageComponent = (props: any) => {
    const [dimensions, setDimensions] = useState({
        width: props.node.attrs.width || 300,
        height: props.node.attrs.height || 200,
    });
    const [isResizing, setIsResizing] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentDimensions = useRef(dimensions);
    const alignment = props.node.attrs.alignment || 'left';

    // Update ref when dimensions change
    useEffect(() => {
        currentDimensions.current = dimensions;
    }, [dimensions]);

    // Load natural image dimensions on first load
    useEffect(() => {
        if (imageRef.current && (!props.node.attrs.width || !props.node.attrs.height)) {
            const img = new window.Image();
            img.onload = () => {
                const maxWidth = 600;
                const imgAspectRatio = img.height / img.width;
                const width = Math.min(img.width, maxWidth);
                const height = width * imgAspectRatio;

                if (width !== dimensions.width || height !== dimensions.height) {
                    setDimensions({ width, height });
                    setTimeout(() => {
                        props.updateAttributes({ width, height });
                    }, 0);
                }
            };
            img.src = props.node.attrs.src;
        }
    }, [props.node.attrs.src, props.node.attrs.width, props.node.attrs.height]);

    const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent TipTap drag from interfering
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = currentDimensions.current.width;
        const startHeight = currentDimensions.current.height;
        const aspectRatio = startHeight / startWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            moveEvent.preventDefault();
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            // Corner handles: preserve aspect ratio
            if (['nw', 'ne', 'sw', 'se'].includes(handle)) {
                // Use the dominant axis for corner resize
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                if (handle === 'se') {
                    newWidth = Math.max(50, startWidth + dx);
                } else if (handle === 'sw') {
                    newWidth = Math.max(50, startWidth - dx);
                } else if (handle === 'ne') {
                    newWidth = Math.max(50, startWidth + dx);
                } else if (handle === 'nw') {
                    newWidth = Math.max(50, startWidth - dx);
                }
                newHeight = newWidth * aspectRatio;
            } else {
                // Edge handles: free resize on single axis
                if (handle === 'e') newWidth = Math.max(50, startWidth + dx);
                if (handle === 'w') newWidth = Math.max(50, startWidth - dx);
                if (handle === 's') newHeight = Math.max(50, startHeight + dy);
                if (handle === 'n') newHeight = Math.max(50, startHeight - dy);
            }

            setDimensions({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            props.updateAttributes({
                width: currentDimensions.current.width,
                height: currentDimensions.current.height,
            });
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const setAlignment = (align: string) => {
        props.updateAttributes({ alignment: align });
    };

    // Compute container alignment style
    const alignmentStyle: React.CSSProperties = {
        display: 'flex',
        justifyContent: alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start',
    };

    // Resize handle helper to reduce repetition
    const ResizeHandle = ({ handle, style }: { handle: string; style: React.CSSProperties }) => (
        <div
            onMouseDown={(e) => handleResizeMouseDown(e, handle)}
            style={{
                position: 'absolute',
                width: '12px',
                height: '12px',
                backgroundColor: 'rgb(168, 85, 247)',
                border: '2px solid white',
                borderRadius: '50%',
                zIndex: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                ...style,
            }}
        />
    );

    return (
        <NodeViewWrapper className="resizable-image-wrapper">
            <div style={alignmentStyle}>
                <div
                    ref={containerRef}
                    className="image-container"
                    style={{
                        width: `${dimensions.width}px`,
                        height: `${dimensions.height}px`,
                        position: 'relative',
                        display: 'inline-block',
                        margin: '0.5rem 0',
                    }}
                >
                    {/* Drag handle on the image itself */}
                    <img
                        ref={imageRef}
                        src={props.node.attrs.src}
                        alt={props.node.attrs.alt}
                        data-drag-handle
                        draggable={!isResizing}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'fill',
                            borderRadius: '0.5rem',
                            cursor: isResizing ? 'default' : 'grab',
                            pointerEvents: 'auto',
                        }}
                    />

                    {/* Alignment buttons - shown when selected */}
                    {props.selected && (
                        <div
                            style={{
                                position: 'absolute',
                                top: '-36px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '2px',
                                backgroundColor: 'rgba(30, 30, 30, 0.95)',
                                borderRadius: '6px',
                                padding: '4px',
                                border: '1px solid rgba(168, 85, 247, 0.5)',
                                zIndex: 20,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            }}
                        >
                            {[
                                { align: 'left', icon: <AlignLeft size={14} /> },
                                { align: 'center', icon: <AlignCenter size={14} /> },
                                { align: 'right', icon: <AlignRight size={14} /> },
                            ].map(({ align, icon }) => (
                                <button
                                    key={align}
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAlignment(align); }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        backgroundColor: alignment === align ? 'rgb(168, 85, 247)' : 'transparent',
                                        color: alignment === align ? 'white' : 'rgba(255,255,255,0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Resize handles - shown when selected */}
                    {props.selected && (
                        <>
                            {/* Corner handles */}
                            <ResizeHandle handle="nw" style={{ top: '-5px', left: '-5px', cursor: 'nw-resize' }} />
                            <ResizeHandle handle="ne" style={{ top: '-5px', right: '-5px', cursor: 'ne-resize' }} />
                            <ResizeHandle handle="sw" style={{ bottom: '-5px', left: '-5px', cursor: 'sw-resize' }} />
                            <ResizeHandle handle="se" style={{ bottom: '-5px', right: '-5px', cursor: 'se-resize' }} />

                            {/* Edge handles */}
                            <ResizeHandle handle="n" style={{ top: '-5px', left: '50%', marginLeft: '-6px', cursor: 'n-resize' }} />
                            <ResizeHandle handle="s" style={{ bottom: '-5px', left: '50%', marginLeft: '-6px', cursor: 's-resize' }} />
                            <ResizeHandle handle="e" style={{ top: '50%', right: '-5px', marginTop: '-6px', cursor: 'e-resize' }} />
                            <ResizeHandle handle="w" style={{ top: '50%', left: '-5px', marginTop: '-6px', cursor: 'w-resize' }} />

                            {/* Selection border */}
                            <div
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    border: '2px solid rgb(168, 85, 247)',
                                    borderRadius: '0.5rem',
                                    pointerEvents: 'none',
                                }}
                            />
                        </>
                    )}
                </div>
            </div>
        </NodeViewWrapper>
    );
};

// Custom Image extension with resizing support
const ResizableImage = Node.create({
    name: 'image',
    group: 'inline',
    inline: true,
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            alt: {
                default: null,
            },
            width: {
                default: 300,
                parseHTML: element => {
                    // Try inline style first, then attribute
                    const styleWidth = element.style.width;
                    if (styleWidth) return parseFloat(styleWidth);
                    const attrWidth = element.getAttribute('width');
                    if (attrWidth) return parseFloat(attrWidth);
                    return 300;
                },
                renderHTML: attributes => {
                    return { width: attributes.width };
                },
            },
            height: {
                default: 200,
                parseHTML: element => {
                    const styleHeight = element.style.height;
                    if (styleHeight) return parseFloat(styleHeight);
                    const attrHeight = element.getAttribute('height');
                    if (attrHeight) return parseFloat(attrHeight);
                    return 200;
                },
                renderHTML: attributes => {
                    return { height: attributes.height };
                },
            },
            alignment: {
                default: 'left',
                parseHTML: element => {
                    return element.getAttribute('data-alignment') || 'left';
                },
                renderHTML: attributes => {
                    return { 'data-alignment': attributes.alignment };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'img[src]',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const { width, height, ...rest } = HTMLAttributes;
        return ['img', {
            ...rest,
            width: width,
            height: height,
            style: `width: ${width}px; height: ${height}px;`,
        }];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageComponent);
    },
});

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const [showBulletMenu, setShowBulletMenu] = useState(false);
    const [showNumberMenu, setShowNumberMenu] = useState(false);
    const [showFontSizeMenu, setShowFontSizeMenu] = useState(false);
    const [currentBulletStyle, setCurrentBulletStyle] = useState("list-disc");
    const [currentNumberStyle, setCurrentNumberStyle] = useState("list-decimal");
    const [currentFontSize, setCurrentFontSize] = useState("16px");
    const bulletMenuRef = useRef<HTMLDivElement>(null);
    const numberMenuRef = useRef<HTMLDivElement>(null);
    const fontSizeMenuRef = useRef<HTMLDivElement>(null);

    // Font size options (like Microsoft Word)
    const fontSizes = [
        "8px", "9px", "10px", "11px", "12px", "14px",
        "16px", "18px", "20px", "22px", "24px", "26px",
        "28px", "36px", "48px", "72px"
    ];

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bulletMenuRef.current && !bulletMenuRef.current.contains(event.target as HTMLElement)) {
                setShowBulletMenu(false);
            }
            if (numberMenuRef.current && !numberMenuRef.current.contains(event.target as HTMLElement)) {
                setShowNumberMenu(false);
            }
            if (fontSizeMenuRef.current && !fontSizeMenuRef.current.contains(event.target as HTMLElement)) {
                setShowFontSizeMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                bulletList: false,
                orderedList: false,
                listItem: false,
            }),
            CustomBulletList.configure({
                HTMLAttributes: {
                    class: "list-disc",
                },
                keepMarks: true,
                keepAttributes: true,
            }),
            CustomOrderedList.configure({
                HTMLAttributes: {
                    class: "list-decimal",
                },
                keepMarks: true,
                keepAttributes: true,
            }),
            ListItem,
            Underline,
            TextStyle,
            FontSize,
            Color,
            ResizableImage,
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

    // Update editor content when value prop changes (for editing existing blogs)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Defer to avoid flushSync warning in React 19
            queueMicrotask(() => {
                editor.commands.setContent(value);
            });
        }
    }, [editor, value]);

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

    const applyBulletStyle = useCallback((styleClass: string) => {
        if (!editor) return;

        const isActive = editor.isActive("bulletList");

        if (isActive) {
            // List is already active, just update the class
            editor.commands.updateAttributes("bulletList", { class: styleClass });
        } else {
            // First toggle on the bullet list
            editor.chain().focus().toggleBulletList().run();
            // Then update its class attribute
            setTimeout(() => {
                editor.commands.updateAttributes("bulletList", { class: styleClass });
            }, 0);
        }

        setCurrentBulletStyle(styleClass);
        setShowBulletMenu(false);
    }, [editor]);

    const applyNumberStyle = useCallback((styleClass: string) => {
        if (!editor) return;

        const isActive = editor.isActive("orderedList");

        if (isActive) {
            // List is already active, just update the class
            editor.commands.updateAttributes("orderedList", { class: styleClass });
        } else {
            // First toggle on the ordered list
            editor.chain().focus().toggleOrderedList().run();
            // Then update its class attribute
            setTimeout(() => {
                editor.commands.updateAttributes("orderedList", { class: styleClass });
            }, 0);
        }

        setCurrentNumberStyle(styleClass);
        setShowNumberMenu(false);
    }, [editor]);

    const applyFontSize = useCallback((size: string) => {
        if (!editor) return;

        if (size === "default") {
            editor.chain().focus().unsetFontSize().run();
        } else {
            editor.chain().focus().setFontSize(size).run();
        }

        setCurrentFontSize(size);
        setShowFontSizeMenu(false);
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

                {/* Font Size Selector */}
                <div className="relative" ref={fontSizeMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowFontSizeMenu(!showFontSizeMenu)}
                        className="toolbar-btn flex items-center gap-1 min-w-[70px] justify-between"
                        title="Font Size"
                    >
                        <Type size={14} />
                        <span className="text-xs">{currentFontSize}</span>
                        <ChevronDown size={12} />
                    </button>
                    {showFontSizeMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-white/20 rounded-lg shadow-xl z-50 p-2 max-h-[300px] overflow-y-auto">
                            <div className="text-xs text-gray-400 mb-2 px-2">Font Size</div>
                            <button
                                type="button"
                                onClick={() => applyFontSize("default")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded text-sm text-gray-300"
                            >
                                Default
                            </button>
                            {fontSizes.map((size) => (
                                <button
                                    key={size}
                                    type="button"
                                    onClick={() => applyFontSize(size)}
                                    className={`w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center justify-between ${currentFontSize === size ? "bg-purple-600/20 text-purple-400" : "text-gray-300"
                                        }`}
                                    style={{ fontSize: size }}
                                >
                                    <span>{size.replace("px", "")}</span>
                                    <span className="text-xs opacity-60">px</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

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

                {/* Lists with Dropdown Styles */}
                <div className="relative" ref={bulletMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowBulletMenu(!showBulletMenu)}
                        className={`toolbar-btn flex items-center gap-1 ${editor.isActive("bulletList") ? "is-active" : ""}`}
                        title="Bullet List"
                    >
                        <List size={16} />
                        <ChevronDown size={12} />
                    </button>
                    {showBulletMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-white/20 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                            <div className="text-xs text-gray-400 mb-2 px-2">Bullet Styles</div>
                            <button
                                type="button"
                                onClick={() => applyBulletStyle("list-disc")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-lg">●</span>
                                <span className="text-sm text-gray-300">Filled Circle</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyBulletStyle("list-circle")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-lg">○</span>
                                <span className="text-sm text-gray-300">Circle</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyBulletStyle("list-square")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-lg">■</span>
                                <span className="text-sm text-gray-300">Square</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyBulletStyle("list-checkmark")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-lg">✓</span>
                                <span className="text-sm text-gray-300">Checkmark</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyBulletStyle("list-arrow")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-lg">➤</span>
                                <span className="text-sm text-gray-300">Arrow</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyBulletStyle("list-diamond")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-lg">◆</span>
                                <span className="text-sm text-gray-300">Diamond</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative" ref={numberMenuRef}>
                    <button
                        type="button"
                        onClick={() => setShowNumberMenu(!showNumberMenu)}
                        className={`toolbar-btn flex items-center gap-1 ${editor.isActive("orderedList") ? "is-active" : ""}`}
                        title="Numbered List"
                    >
                        <ListOrdered size={16} />
                        <ChevronDown size={12} />
                    </button>
                    {showNumberMenu && (
                        <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-white/20 rounded-lg shadow-xl z-50 p-2 min-w-[200px]">
                            <div className="text-xs text-gray-400 mb-2 px-2">Numbering Styles</div>
                            <button
                                type="button"
                                onClick={() => applyNumberStyle("list-decimal")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-sm font-mono">1. 2. 3.</span>
                                <span className="text-sm text-gray-300">Numbers</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyNumberStyle("list-lower-alpha")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-sm font-mono">a. b. c.</span>
                                <span className="text-sm text-gray-300">Lowercase Letters</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyNumberStyle("list-upper-alpha")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-sm font-mono">A. B. C.</span>
                                <span className="text-sm text-gray-300">Uppercase Letters</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyNumberStyle("list-lower-roman")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-sm font-mono">i. ii. iii.</span>
                                <span className="text-sm text-gray-300">Lowercase Roman</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => applyNumberStyle("list-upper-roman")}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-sm font-mono">I. II. III.</span>
                                <span className="text-sm text-gray-300">Uppercase Roman</span>
                            </button>
                        </div>
                    )}
                </div>

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
