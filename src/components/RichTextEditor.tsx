"use client";

import { useEditor, EditorContent, NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Extension, Node } from "@tiptap/core";
import { NodeSelection } from "prosemirror-state";
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
    Palette,
    Square,
} from "lucide-react";
import { useCallback, useState, useEffect, useRef } from "react";
import api from "../utils/api";
import { uploadImageFile } from "../utils/contentImages";
import type { EditorView } from "@tiptap/pm/view";

// Pasted or dropped image files are uploaded to the backend instead of being
// embedded as base64 data URLs. Base64 inflates the saved article by megabytes
// and is what makes long posts fail to upload.
function imageFilesFrom(data: DataTransfer | null): File[] {
    if (!data) return [];
    return Array.from(data.files).filter((file) => file.type.startsWith("image/"));
}

async function uploadAndInsertImages(view: EditorView, files: File[], at?: number) {
    let pos = at;
    for (const file of files) {
        try {
            const url = await uploadImageFile(file);
            const { state } = view;
            const node = state.schema.nodes.image.create({ src: url });
            view.dispatch(pos == null ? state.tr.replaceSelectionWith(node) : state.tr.insert(pos, node));
            if (pos != null) pos += node.nodeSize;
        } catch (error) {
            console.error("Image upload failed:", error);
            alert(
                `Could not upload "${file.name}".

` +
                    "Check that you are still logged in as admin and that the backend is reachable."
            );
        }
    }
}

// Extend TipTap Commands interface for custom commands
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        textBox: {
            setTextBox: () => ReturnType;
            toggleTextBox: () => ReturnType;
        };
    }
}


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
                parseHTML: element => {
                    // Get class but strip out 'list-2col' — columns is tracked separately
                    const cls = element.getAttribute('class') || 'list-disc';
                    return cls.replace(/\s*list-2col/g, '').trim() || 'list-disc';
                },
                renderHTML: attributes => {
                    return {
                        class: attributes.class,
                    };
                },
            },
            columns: {
                default: 1,
                parseHTML: element => {
                    // Support both data-columns and legacy list-2col class
                    const dataCols = element.getAttribute('data-columns');
                    if (dataCols) return parseInt(dataCols);
                    if (element.classList.contains('list-2col')) return 2;
                    return 1;
                },
                renderHTML: attributes => {
                    if (attributes.columns > 1) {
                        return { 'data-columns': attributes.columns };
                    }
                    return {};
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
    const [dimensions, setDimensions] = useState<{ width: number | null; height: number | null }>({
        width: props.node.attrs.width || null,
        height: props.node.attrs.height || null,
    });
    const [isResizing, setIsResizing] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentDimensions = useRef(dimensions);
    const alignment = props.node.attrs.alignment || 'left';

    // Update ref when dimensions change
    useEffect(() => {
        currentDimensions.current = dimensions;
    }, [dimensions]);

    // Load natural image dimensions on first load or when dimensions are null
    useEffect(() => {
        const img = new window.Image();
        img.onload = () => {
            const maxWidth = 600;
            const imgAspectRatio = img.height / img.width;

            if (!dimensions.width || !dimensions.height) {
                const width = Math.min(img.width, maxWidth);
                const height = width * imgAspectRatio;
                setDimensions({ width, height });
                setTimeout(() => {
                    props.updateAttributes({ width, height });
                }, 0);
            }
            setLoaded(true);
        };
        img.onerror = () => {
            // Fallback dimensions if image fails to load
            if (!dimensions.width) setDimensions(d => ({ ...d, width: 300 }));
            if (!dimensions.height) setDimensions(d => ({ ...d, height: 200 }));
            setLoaded(true);
        };
        img.src = props.node.attrs.src;
    }, [props.node.attrs.src]);

    const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent TipTap drag from interfering
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = currentDimensions.current.width || 300;
        const startHeight = currentDimensions.current.height || 200;
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
                        width: dimensions.width ? `${dimensions.width}px` : 'auto',
                        height: dimensions.height ? `${dimensions.height}px` : 'auto',
                        position: 'relative',
                        display: 'inline-block',
                        margin: '0.5rem 0',
                        maxWidth: '100%',
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
                            width: dimensions.width ? '100%' : undefined,
                            height: dimensions.height ? '100%' : undefined,
                            maxWidth: '100%',
                            objectFit: dimensions.width && dimensions.height ? 'fill' : 'contain',
                            borderRadius: '0.5rem',
                            cursor: isResizing ? 'default' : 'grab',
                            pointerEvents: 'auto',
                            display: 'block',
                        }}
                        onLoad={(e) => {
                            // If dimensions are still null after mount, get them from the rendered image
                            if (!dimensions.width || !dimensions.height) {
                                const imgEl = e.currentTarget;
                                const naturalW = imgEl.naturalWidth;
                                const naturalH = imgEl.naturalHeight;
                                const maxW = 600;
                                const ratio = naturalH / naturalW;
                                const w = Math.min(naturalW, maxW);
                                const h = w * ratio;
                                setDimensions({ width: w, height: h });
                                setTimeout(() => {
                                    props.updateAttributes({ width: w, height: h });
                                }, 0);
                            }
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
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
                parseHTML: element => element.getAttribute('src'),
                renderHTML: attributes => {
                    if (!attributes.src) return {};
                    return { src: attributes.src };
                },
            },
            alt: {
                default: null,
                parseHTML: element => element.getAttribute('alt'),
                renderHTML: attributes => {
                    if (!attributes.alt) return {};
                    return { alt: attributes.alt };
                },
            },
            width: {
                default: null,
                parseHTML: element => {
                    const styleWidth = element.style.width;
                    if (styleWidth && styleWidth !== 'auto') {
                        const parsed = parseFloat(styleWidth);
                        if (!isNaN(parsed) && parsed > 0) return parsed;
                    }
                    const attrWidth = element.getAttribute('width');
                    if (attrWidth) {
                        const parsed = parseFloat(attrWidth);
                        if (!isNaN(parsed) && parsed > 0) return parsed;
                    }
                    return null;
                },
                renderHTML: attributes => {
                    if (!attributes.width) return {};
                    return { width: attributes.width };
                },
            },
            height: {
                default: null,
                parseHTML: element => {
                    const styleHeight = element.style.height;
                    if (styleHeight && styleHeight !== 'auto') {
                        const parsed = parseFloat(styleHeight);
                        if (!isNaN(parsed) && parsed > 0) return parsed;
                    }
                    const attrHeight = element.getAttribute('height');
                    if (attrHeight) {
                        const parsed = parseFloat(attrHeight);
                        if (!isNaN(parsed) && parsed > 0) return parsed;
                    }
                    return null;
                },
                renderHTML: attributes => {
                    if (!attributes.height) return {};
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
        const styles: string[] = [];
        const attrs: Record<string, any> = { ...rest };

        if (width) {
            attrs.width = width;
            styles.push(`width: ${width}px`);
        }
        if (height) {
            attrs.height = height;
            styles.push(`height: ${height}px`);
        }
        if (styles.length > 0) {
            attrs.style = styles.join('; ') + ';';
        }

        return ['img', attrs];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableImageComponent);
    },
});

// Resizable TextBox Component
const ResizableTextBoxComponent = (props: any) => {
    const [dimensions, setDimensions] = useState({
        width: props.node.attrs.width || 400,
        height: props.node.attrs.height || 'auto',
    });
    const [position, setPosition] = useState({
        x: props.node.attrs.x || 0,
        y: props.node.attrs.y || 0,
    });
    const isBorderless = props.node.attrs.borderless || false;
    const hasMoved = (position.x !== 0 || position.y !== 0);
    const [isDragging, setIsDragging] = useState(false);
    const currentDimensions = useRef(dimensions);
    const currentPosition = useRef(position);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update refs when values change
    useEffect(() => {
        currentDimensions.current = dimensions;
    }, [dimensions]);

    useEffect(() => {
        currentPosition.current = position;
    }, [position]);

    // Handle resize
    const handleResizeMouseDown = (e: React.MouseEvent, corner: string) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = dimensions.width;
        const startHeight = dimensions.height;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;

            if (corner.includes('e')) {
                newWidth = Math.max(200, startWidth + dx);
            }
            if (corner.includes('w')) {
                newWidth = Math.max(200, startWidth - dx);
            }
            if (corner.includes('s')) {
                newHeight = Math.max(100, startHeight + dy);
            }
            if (corner.includes('n')) {
                newHeight = Math.max(100, startHeight - dy);
            }

            setDimensions({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
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

    // Handle drag
    const handleDragMouseDown = (e: React.MouseEvent) => {
        if (!props.selected) return;

        // Only allow dragging from the drag handle or border, not the content
        const target = e.target as HTMLElement;
        if (!target.classList.contains('drag-handle') &&
            !target.classList.contains('textbox-border')) {
            return;
        }

        e.preventDefault();
        setIsDragging(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startPosX = position.x;
        const startPosY = position.y;

        // Find the scrollable editor content container
        const scrollContainer = containerRef.current?.closest('.overflow-y-auto') as HTMLElement | null;
        let scrollAnimId: number | null = null;

        const autoScroll = (clientY: number) => {
            if (!scrollContainer) return;
            const rect = scrollContainer.getBoundingClientRect();
            const edgeZone = 60; // px from edge to start scrolling
            const maxSpeed = 15; // px per frame

            if (clientY < rect.top + edgeZone) {
                // Near top edge — scroll up
                const intensity = 1 - (clientY - rect.top) / edgeZone;
                scrollContainer.scrollTop -= Math.max(1, maxSpeed * Math.min(1, intensity));
            } else if (clientY > rect.bottom - edgeZone) {
                // Near bottom edge — scroll down
                const intensity = 1 - (rect.bottom - clientY) / edgeZone;
                scrollContainer.scrollTop += Math.max(1, maxSpeed * Math.min(1, intensity));
            }
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;

            setPosition({
                x: startPosX + dx,
                y: startPosY + dy,
            });

            // Auto-scroll when dragging near edges
            autoScroll(moveEvent.clientY);

            // Keep scrolling while mouse stays near edge
            if (scrollAnimId) cancelAnimationFrame(scrollAnimId);
            const loop = () => {
                autoScroll(moveEvent.clientY);
                scrollAnimId = requestAnimationFrame(loop);
            };
            scrollAnimId = requestAnimationFrame(loop);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            if (scrollAnimId) cancelAnimationFrame(scrollAnimId);

            // Calculate siblingOffset by measuring actual rendered sibling positions
            let siblingOffset = 0;
            const wrapper = containerRef.current?.closest('.resizable-textbox-wrapper') as HTMLElement | null;
            if (wrapper && currentPosition.current.y !== 0) {
                const parent = wrapper.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children) as HTMLElement[];
                    const currentIndex = siblings.indexOf(wrapper);
                    const wrapperTop = wrapper.getBoundingClientRect().top;
                    const targetY = wrapperTop + currentPosition.current.y;

                    if (currentPosition.current.y < 0) {
                        // Dragged up — count siblings whose center we've passed above
                        for (let i = currentIndex - 1; i >= 0; i--) {
                            const sibRect = siblings[i].getBoundingClientRect();
                            const sibCenter = (sibRect.top + sibRect.bottom) / 2;
                            if (sibCenter > targetY) {
                                siblingOffset--;
                            } else {
                                break;
                            }
                        }
                    } else {
                        // Dragged down — count siblings whose center we've passed below
                        for (let i = currentIndex + 1; i < siblings.length; i++) {
                            const sibRect = siblings[i].getBoundingClientRect();
                            const sibCenter = (sibRect.top + sibRect.bottom) / 2;
                            if (sibCenter < targetY) {
                                siblingOffset++;
                            } else {
                                break;
                            }
                        }
                    }
                }
            }

            props.updateAttributes({
                x: currentPosition.current.x,
                y: currentPosition.current.y,
                siblingOffset,
            });
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Handle click to select the text box
    const handleSelectTextBox = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        // Select if clicking on the border area or container, not the inner content
        if (target.classList.contains('text-box-content') ||
            target.classList.contains('textbox-container')) {
            // Check if clicking on border/padding area (not on the actual editable content)
            const contentDiv = target.classList.contains('text-box-content') ? target : target.querySelector('.text-box-content');
            if (contentDiv) {
                const rect = contentDiv.getBoundingClientRect();
                const padding = 16; // 1rem = 16px
                const clickX = e.clientX - rect.left;
                const clickY = e.clientY - rect.top;

                // If clicking in the padding/border area (not in the inner content area)
                if (clickX < padding || clickX > rect.width - padding ||
                    clickY < padding || clickY > rect.height - padding) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Select the entire text box node
                    const { view, getPos } = props;
                    const pos = getPos();
                    if (pos !== undefined) {
                        const nodeSelection = NodeSelection.create(view.state.doc, pos);
                        view.dispatch(view.state.tr.setSelection(nodeSelection));
                    }
                }
            }
        }
    };

    return (
        <NodeViewWrapper className="resizable-textbox-wrapper" style={{
            position: 'relative',
            ...(hasMoved ? { height: 0, overflow: 'visible' } : {}),
        }}>
            <div
                ref={containerRef}
                className="textbox-container"
                onClick={handleSelectTextBox}
                style={{
                    width: `${dimensions.width}px`,
                    ...(dimensions.height !== 'auto' ? { minHeight: `${dimensions.height}px` } : {}),
                    position: hasMoved ? 'absolute' : 'relative',
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: hasMoved ? 10 : 'auto',
                    margin: hasMoved ? 0 : '0.5rem 0',
                }}
            >
                {/* Drag Handle - Only visible when selected and not borderless */}
                {props.selected && !isBorderless && (
                    <>
                        <div
                            className="drag-handle"
                            onMouseDown={handleDragMouseDown}
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '40px',
                                height: '20px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                borderRadius: '4px 4px 0 0',
                                cursor: isDragging ? 'grabbing' : 'grab',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                color: 'white',
                                fontWeight: 'bold',
                                zIndex: 20,
                            }}
                            title="Drag to move"
                        >
                            ⠿
                        </div>

                        {/* Remove Text Box Border Button */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                // Toggle borderless mode instead of deleting
                                props.updateAttributes({
                                    borderless: true,
                                });
                            }}
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                right: '0',
                                width: '80px',
                                height: '20px',
                                backgroundColor: 'rgb(239, 68, 68)',
                                borderRadius: '4px 4px 0 0',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                color: 'white',
                                fontWeight: 'bold',
                                border: 'none',
                                zIndex: 20,
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgb(220, 38, 38)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgb(239, 68, 68)';
                            }}
                            title="Remove text box border (keep content and position)"
                        >
                            ✕ Remove Box
                        </button>
                    </>
                )}

                <div
                    className="text-box-content"
                    onClick={handleSelectTextBox}
                    style={{
                        width: '100%',
                        minHeight: '100%',
                        padding: isBorderless ? '0' : '1rem',
                        border: isBorderless
                            ? 'none'
                            : (props.selected
                                ? '2px solid rgba(168, 85, 247, 0.9)'
                                : '2px solid rgba(168, 85, 247, 0.5)'),
                        borderRadius: isBorderless ? '0' : '0.5rem',
                        backgroundColor: isBorderless ? 'transparent' : 'rgba(24, 24, 27, 0.3)',
                        cursor: 'text',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        boxShadow: (props.selected && !isBorderless)
                            ? '0 0 0 1px rgba(168, 85, 247, 0.3)'
                            : 'none',
                    }}
                >
                    <NodeViewContent className="text-box-inner-content" />
                </div>

                {props.selected && !isBorderless && (
                    <>
                        {/* Corner resize handles */}
                        <div
                            className="resize-handle nw"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                            style={{
                                position: 'absolute',
                                top: '-4px',
                                left: '-4px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 'nw-resize',
                                zIndex: 10,
                            }}
                        />
                        <div
                            className="resize-handle ne"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                            style={{
                                position: 'absolute',
                                top: '-4px',
                                right: '-4px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 'ne-resize',
                                zIndex: 10,
                            }}
                        />
                        <div
                            className="resize-handle sw"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                            style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '-4px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 'sw-resize',
                                zIndex: 10,
                            }}
                        />
                        <div
                            className="resize-handle se"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                            style={{
                                position: 'absolute',
                                bottom: '-4px',
                                right: '-4px',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 'se-resize',
                                zIndex: 10,
                            }}
                        />

                        {/* Edge resize handles */}
                        <div
                            className="resize-handle n"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                            style={{
                                position: 'absolute',
                                top: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 'n-resize',
                                zIndex: 10,
                            }}
                        />
                        <div
                            className="resize-handle s"
                            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                            style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 's-resize',
                                zIndex: 10,
                            }}
                        />
                        <div
                            className="resize-handle e"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                right: '-4px',
                                transform: 'translateY(-50%)',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 'e-resize',
                                zIndex: 10,
                            }}
                        />
                        <div
                            className="resize-handle w"
                            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                left: '-4px',
                                transform: 'translateY(-50%)',
                                width: '10px',
                                height: '10px',
                                backgroundColor: 'rgb(168, 85, 247)',
                                border: '2px solid white',
                                borderRadius: '50%',
                                cursor: 'w-resize',
                                zIndex: 10,
                            }}
                        />
                    </>
                )}
            </div>
        </NodeViewWrapper>
    );
};

// TextBox Extension - Like Word's text box
const TextBox = Node.create({
    name: 'textBox',
    group: 'block',
    content: 'block+',
    draggable: true,
    isolating: false,

    addAttributes() {
        return {
            class: {
                default: 'text-box',
            },
            width: {
                default: 400,
                parseHTML: element => element.getAttribute('data-width'),
                renderHTML: attributes => {
                    return {
                        'data-width': attributes.width,
                    };
                },
            },
            height: {
                default: 'auto',
                parseHTML: element => element.getAttribute('data-height') || 'auto',
                renderHTML: attributes => {
                    return {
                        'data-height': attributes.height,
                    };
                },
            },
            x: {
                default: 0,
                parseHTML: element => element.getAttribute('data-x'),
                renderHTML: attributes => {
                    return {
                        'data-x': attributes.x,
                    };
                },
            },
            y: {
                default: 0,
                parseHTML: element => element.getAttribute('data-y'),
                renderHTML: attributes => {
                    return {
                        'data-y': attributes.y,
                    };
                },
            },
            borderless: {
                default: false,
                parseHTML: element => element.getAttribute('data-borderless') === 'true',
                renderHTML: attributes => {
                    return {
                        'data-borderless': attributes.borderless,
                    };
                },
            },
            siblingOffset: {
                default: 0,
                parseHTML: element => {
                    const val = element.getAttribute('data-sibling-offset');
                    return val ? parseInt(val) : 0;
                },
                renderHTML: attributes => {
                    return {
                        'data-sibling-offset': attributes.siblingOffset,
                    };
                },
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div.text-box',
            },
            {
                tag: 'div.text-box-borderless',
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        const isBorderless = HTMLAttributes['data-borderless'] === 'true' || HTMLAttributes['data-borderless'] === true;
        const heightVal = HTMLAttributes['data-height'];
        const heightStyle = (heightVal && heightVal !== 'auto') ? `min-height: ${heightVal}px;` : '';
        const width = HTMLAttributes['data-width'] || 400;

        const boxClass = isBorderless ? 'text-box-borderless' : 'text-box';
        const boxStyle = `width: ${width}px; ${heightStyle}`.trim();

        return ['div', {
            ...HTMLAttributes,
            class: boxClass,
            style: boxStyle
        }, 0];
    },

    addNodeView() {
        return ReactNodeViewRenderer(ResizableTextBoxComponent);
    },

    addCommands() {
        return {
            setTextBox:
                () =>
                    ({ commands }) => {
                        return commands.wrapIn(this.name);
                    },
            toggleTextBox:
                () =>
                    ({ commands, state, chain }) => {
                        const { $from } = state.selection;

                        // Check if cursor is inside a text box
                        let isInTextBox = false;
                        for (let d = $from.depth; d > 0; d--) {
                            if ($from.node(d).type.name === this.name) {
                                isInTextBox = true;
                                break;
                            }
                        }

                        if (isInTextBox) {
                            // Remove the text box, keeping the content
                            return chain().lift(this.name).run();
                        } else {
                            // Wrap selection in a text box
                            return chain().wrapIn(this.name).run();
                        }
                    },
        };
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
    const [currentColor, setCurrentColor] = useState("#ffffff");
    const bulletMenuRef = useRef<HTMLDivElement>(null);
    const numberMenuRef = useRef<HTMLDivElement>(null);
    const fontSizeMenuRef = useRef<HTMLDivElement>(null);
    const colorInputRef = useRef<HTMLInputElement>(null);

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
            Color.configure({
                types: ['textStyle'],
            }),
            Color,
            ResizableImage,
            TextBox,
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
            // Update current color from editor
            const color = editor.getAttributes('textStyle').color;
            if (color) {
                setCurrentColor(color);
            }
        },
        onSelectionUpdate: ({ editor }) => {
            // Update current color when selection changes
            const color = editor.getAttributes('textStyle').color;
            if (color) {
                setCurrentColor(color);
            }
        },
        editorProps: {
            attributes: {
                class: "prose prose-invert max-w-none focus:outline-none min-h-[300px] px-4 py-3",
                style: "position: relative;",
            },
            handlePaste: (view, event) => {
                const files = imageFilesFrom(event.clipboardData);
                if (files.length === 0) return false;
                event.preventDefault();
                void uploadAndInsertImages(view, files);
                return true;
            },
            handleDrop: (view, event, _slice, moved) => {
                if (moved) return false;
                const files = imageFilesFrom(event.dataTransfer);
                if (files.length === 0) return false;
                event.preventDefault();
                const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
                void uploadAndInsertImages(view, files, coords?.pos);
                return true;
            },
        },
    });

    // Update editor content when value prop changes (e.g., when editing a blog)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            // Defer to avoid flushSync warning in React 19
            queueMicrotask(() => {
                editor.commands.setContent(value);
            });
        }
    }, [value, editor]);

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
        <div className="border border-white/10 rounded-lg bg-black/20 flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Toolbar - fixed at top, never scrolls */}
            <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-zinc-900/95 rounded-t-lg flex-shrink-0 z-10">
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

                {/* Text Color Picker */}
                <div className="relative">
                    <input
                        ref={colorInputRef}
                        type="color"
                        value={currentColor}
                        onChange={(e) => {
                            const color = e.target.value;
                            setCurrentColor(color);
                            if (editor) {
                                // Use chain to ensure focus is maintained
                                editor.chain().focus().setColor(color).run();
                            }
                        }}
                        onBlur={() => {
                            // Refocus editor after color picker closes
                            if (editor) {
                                editor.commands.focus();
                            }
                        }}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => {
                            if (colorInputRef.current) {
                                colorInputRef.current.click();
                                // Small delay to ensure the color picker opens
                                setTimeout(() => {
                                    colorInputRef.current?.focus();
                                }, 10);
                            }
                        }}
                        className="toolbar-btn flex items-center gap-1"
                        title="Text Color"
                    >
                        <Palette size={16} />
                        <div
                            className="w-4 h-4 rounded border border-white/20"
                            style={{ backgroundColor: currentColor }}
                        />
                    </button>
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
                            <div className="border-t border-white/10 my-2"></div>
                            <div className="text-xs text-gray-400 mb-2 px-2">Layout</div>
                            <button
                                type="button"
                                onClick={() => {
                                    if (!editor) return;
                                    const isActive = editor.isActive("bulletList");
                                    if (!isActive) {
                                        editor.chain().focus().toggleBulletList().run();
                                    }
                                    // Toggle columns attribute between 1 and 2
                                    const attrs = editor.getAttributes("bulletList");
                                    const currentCols = attrs.columns || 1;
                                    editor.commands.updateAttributes("bulletList", {
                                        columns: currentCols === 2 ? 1 : 2,
                                    });
                                    setShowBulletMenu(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-white/10 rounded flex items-center gap-3"
                            >
                                <span className="text-lg">▥</span>
                                <span className="text-sm text-gray-300">2 Columns</span>
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

                {/* Text Box */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleTextBox().run()}
                    className={`toolbar-btn ${editor.isActive("textBox") ? "is-active" : ""}`}
                    title="Insert/Remove Text Box (wrap content in a movable box)"
                >
                    <Square size={16} />
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

            {/* Editor Content - scrollable */}
            <div className="overflow-y-auto flex-1 min-h-0">
                <EditorContent editor={editor} placeholder={placeholder} />
            </div>
        </div>
    );
}
