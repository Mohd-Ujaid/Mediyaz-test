"use client";

import React, { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  ShieldCheck,
  Info,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUpload?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  onImageUpload,
  placeholder = "Write the clinical article content here... Support for headings, lists, quotes, and statutory callouts.",
  disabled = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-teal-600 underline hover:text-teal-800 transition cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-2xl max-w-full my-6 border border-slate-200 shadow-md",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || "",
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        id: "tiptap-content-editor",
        class:
          "prose prose-slate dark:prose-invert max-w-none min-h-[380px] p-5 focus:outline-none focus:ring-0 text-sm sm:text-base leading-relaxed",
      },
    },
    immediatelyRender: false,
  });

  // Keep editor content in sync when loaded from external state
  useEffect(() => {
    if (editor && content !== undefined) {
      if (editor.getHTML() !== content && editor.getText() === "" && content !== "") {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter destination URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertImagePrompt = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter image URL (or use ImageKit upload button):");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertCallout = useCallback(
    (type: "statutory" | "clinical" | "important") => {
      if (!editor) return;

      let calloutHtml = "";
      if (type === "statutory") {
        calloutHtml = `
          <blockquote class="border-l-4 border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-r-xl my-4 text-amber-900 dark:text-amber-200">
            <strong>Statutory Requirement (ART Act 2021):</strong> Ensure mandatory 12-month health insurance and voluntary written informed consent.
          </blockquote>
        `;
      } else if (type === "clinical") {
        calloutHtml = `
          <blockquote class="border-l-4 border-teal-600 bg-teal-50/70 dark:bg-teal-950/30 p-4 rounded-r-xl my-4 text-teal-900 dark:text-teal-200">
            <strong>Clinical Screening Protocol:</strong> Verify infectious disease panel (HIV, Hep B/C, VDRL), AMH &gt; 2.0 ng/mL, and karyotype analysis.
          </blockquote>
        `;
      } else {
        calloutHtml = `
          <blockquote class="border-l-4 border-rose-500 bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-r-xl my-4 text-rose-900 dark:text-rose-200">
            <strong>Legal Constraint:</strong> Strict anonymity must be preserved between donor and commissioning parents under Section 27.
          </blockquote>
        `;
      }

      editor.chain().focus().insertContent(calloutHtml).run();
    },
    [editor]
  );

  if (!editor) {
    return (
      <div className="min-h-[400px] border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 text-xs">
        Loading Tiptap Editor Suite...
      </div>
    );
  }

  // Calculate stats
  const text = editor.getText();
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs focus-within:border-teal-600 transition-colors">
      {/* Primary Toolbar */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 p-2 flex flex-wrap items-center gap-1">
        
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1.5 border-r border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("heading", { level: 1 })
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("heading", { level: 2 })
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Heading 2 (TOC Section)"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("heading", { level: 3 })
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Inline Formatting */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("bold")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("italic")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("strike")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("code")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </Button>
        </div>

        {/* Lists & Quotes */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("bulletList")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("orderedList")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("blockquote")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Blockquote"
          >
            <Quote className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Divider Line"
          >
            <Minus className="w-4 h-4" />
          </Button>
        </div>

        {/* Links & Images */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={setLink}
            className={`h-8 w-8 p-0 rounded-lg ${
              editor.isActive("link")
                ? "bg-teal-600 text-white hover:bg-teal-700"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Add Link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
          {editor.isActive("link") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().unsetLink().run()}
              className="h-8 w-8 p-0 rounded-lg text-rose-600 hover:bg-rose-50"
              title="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertImagePrompt}
            className="h-8 w-8 p-0 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
            title="Insert Image by URL"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          {onImageUpload && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onImageUpload}
              className="h-8 px-2 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 gap-1"
              title="Upload to ImageKit"
            >
              <Upload className="w-3.5 h-3.5" /> CDN Upload
            </Button>
          )}
        </div>

        {/* Clinical Callout Presets */}
        <div className="flex items-center gap-1 pl-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertCallout("statutory")}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 gap-1"
            title="Insert Statutory ART Act 2021 Box"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> ART Act Callout
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertCallout("clinical")}
            className="h-8 px-2.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200 gap-1"
            title="Insert Clinical Protocol Box"
          >
            <Info className="w-3.5 h-3.5 text-teal-700" /> Clinical Box
          </Button>
        </div>

      </div>

      {/* Editor Content Surface */}
      <div className="bg-white dark:bg-slate-900 min-h-[420px]">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Word Count & Metric Bar */}
      <div className="border-t border-slate-100 dark:border-slate-800/80 px-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>
            <strong>{wordCount}</strong> words
          </span>
          <span>•</span>
          <span>
            <strong>{charCount}</strong> characters
          </span>
          <span>•</span>
          <span className="text-teal-600 dark:text-teal-400 font-medium">
            ~{readTime} min read
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
          <span>Powered by Tiptap Rich Engine</span>
        </div>
      </div>
    </div>
  );
}
