"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { uploadImage } from "@/lib/uploadImage";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    mode: "general" | "html";
    onModeChange: (mode: "general" | "html") => void;
}

const TOOLBAR_BUTTONS = [
    { command: "bold", icon: "B", title: "Bold", style: "font-bold" },
    { command: "italic", icon: "I", title: "Italic", style: "italic" },
    { command: "underline", icon: "U", title: "Underline", style: "underline" },
    { command: "strikeThrough", icon: "S", title: "Strikethrough", style: "line-through" },
    { separator: true },
    { command: "formatBlock_H1", icon: "H1", title: "Heading 1", style: "font-bold text-sm" },
    { command: "formatBlock_H2", icon: "H2", title: "Heading 2", style: "font-bold text-sm" },
    { command: "formatBlock_H3", icon: "H3", title: "Heading 3", style: "font-bold text-sm" },
    { separator: true },
    { command: "insertUnorderedList", icon: "•≡", title: "Bullet List", style: "text-sm" },
    { command: "insertOrderedList", icon: "1≡", title: "Numbered List", style: "text-sm" },
    { separator: true },
    { command: "formatBlock_BLOCKQUOTE", icon: "❝", title: "Blockquote", style: "text-lg" },
    { command: "createLink", icon: "🔗", title: "Insert Link", style: "text-sm" },
    { command: "insertImage", icon: "🖼", title: "Insert Image", style: "text-sm" },
    { separator: true },
    { command: "undo", icon: "↩", title: "Undo", style: "text-sm" },
    { command: "redo", icon: "↪", title: "Redo", style: "text-sm" },
];

export default function RichTextEditor({ value, onChange, mode, onModeChange }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const isInternalUpdate = useRef(false);

    // Sync value into the editor when value changes externally (e.g. loading saved content)
    useEffect(() => {
        if (mode === "general" && editorRef.current && !isInternalUpdate.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value;
            }
        }
        isInternalUpdate.current = false;
    }, [value, mode]);

    const handleInput = useCallback(() => {
        if (editorRef.current) {
            isInternalUpdate.current = true;
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const execCommand = useCallback((command: string) => {
        // Ensure the editor is focused before executing commands
        editorRef.current?.focus();

        if (command.startsWith("formatBlock_")) {
            const tag = command.replace("formatBlock_", "");
            document.execCommand("formatBlock", false, `<${tag}>`);
        } else if (command === "createLink") {
            const url = prompt("Enter URL:");
            if (url) {
                document.execCommand("createLink", false, url);
            }
        } else if (command === "insertImage") {
            fileInputRef.current?.click();
        } else {
            document.execCommand(command, false);
        }
        handleInput();
    }, [handleInput]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const url = await uploadImage(file, "images/blog-content");
            // Insert the image at the cursor position
            document.execCommand(
                "insertHTML",
                false,
                `<img src="${url}" alt="Blog image" style="max-width:100%;height:auto;border-radius:8px;margin:16px 0;" />`
            );
            handleInput();
        } catch (error) {
            console.error("Image upload failed:", error);
            alert("ছবি আপলোড করতে ব্যর্থ হয়েছে।");
        } finally {
            setUploading(false);
            // Reset the file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Content</label>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => onModeChange("general")}
                    className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${mode === "general"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    General
                </button>
                <button
                    type="button"
                    onClick={() => onModeChange("html")}
                    className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${mode === "html"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                >
                    HTML Format
                </button>
            </div>

            {mode === "general" ? (
                <>
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-md">
                        {TOOLBAR_BUTTONS.map((btn, i) => {
                            if ('separator' in btn && btn.separator) {
                                return <div key={`sep-${i}`} className="w-px h-6 bg-gray-300 mx-1" />;
                            }
                            return (
                                <button
                                    key={btn.command}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent stealing focus from editor
                                        execCommand(btn.command!);
                                    }}
                                    title={btn.title}
                                    disabled={uploading}
                                    className={`px-2 py-1 rounded hover:bg-gray-200 active:bg-gray-300 transition-colors text-gray-700 ${btn.style || ""} ${uploading ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                >
                                    {btn.icon}
                                </button>
                            );
                        })}
                        {uploading && (
                            <span className="ml-2 text-xs text-blue-600 animate-pulse">আপলোড হচ্ছে...</span>
                        )}
                    </div>

                    {/* Editable Area */}
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleInput}
                        className="min-h-[400px] p-4 border border-t-0 border-gray-300 rounded-b-md focus:outline-none focus:ring-1 focus:ring-blue-500 prose prose-lg max-w-none bg-white overflow-y-auto"
                        style={{ minHeight: "400px" }}
                        suppressContentEditableWarning
                    />

                    {/* Hidden file input for image upload */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </>
            ) : (
                /* HTML Mode */
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="আপনার HTML কোড পেস্ট করুন..."
                    rows={20}
                    className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 border-gray-300 font-mono text-sm bg-gray-900 text-green-400"
                />
            )}
        </div>
    );
}
