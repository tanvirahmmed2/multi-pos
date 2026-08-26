'use client'
import React, { useEffect, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  BiBold, 
  BiItalic, 
  BiStrikethrough, 
  BiListUl, 
  BiListOl, 
  BiCodeBlock, 
  BiSolidQuoteLeft, 
  BiUndo, 
  BiRedo, 
  BiHeading 
} from 'react-icons/bi'

export default function RichTextEditor({ value, onChange, placeholder = '' }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      })
    ],
    content: value || '',
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content with external value changes (e.g. initial data loading)
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!isMounted || !editor) {
    return (
      <div className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl animate-pulse flex items-center justify-center text-slate-400 text-xs">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="w-full border border-slate-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition flex flex-col min-h-[150px]">
      
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-50 border-b border-slate-200 p-1.5 text-slate-600">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900 font-bold' : ''}`}
          title="Bold"
        >
          <BiBold className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Italic"
        >
          <BiItalic className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer ${editor.isActive('strike') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Strikethrough"
        >
          <BiStrikethrough className="text-base" />
        </button>
        
        <span className="w-px h-5 bg-slate-200 mx-1"></span>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer flex items-center gap-0.5 ${editor.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Heading 2"
        >
          <BiHeading className="text-base" />
          <span className="text-[10px] font-bold">H2</span>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer flex items-center gap-0.5 ${editor.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Heading 3"
        >
          <BiHeading className="text-base" />
          <span className="text-[10px] font-bold">H3</span>
        </button>

        <span className="w-px h-5 bg-slate-200 mx-1"></span>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Bullet List"
        >
          <BiListUl className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Ordered List"
        >
          <BiListOl className="text-base" />
        </button>

        <span className="w-px h-5 bg-slate-200 mx-1"></span>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer ${editor.isActive('codeBlock') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Code Block"
        >
          <BiCodeBlock className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer ${editor.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : ''}`}
          title="Blockquote"
        >
          <BiSolidQuoteLeft className="text-base" />
        </button>

        <span className="w-px h-5 bg-slate-200 mx-1"></span>

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
          title="Undo"
        >
          <BiUndo className="text-base" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
          title="Redo"
        >
          <BiRedo className="text-base" />
        </button>
      </div>

      {/* Editor Content Area */}
      <div 
        onClick={() => editor.chain().focus().run()}
        className="flex-1 p-3 text-slate-800 text-sm cursor-text min-h-[120px]"
      >
        <EditorContent editor={editor} />
      </div>

    </div>
  )
}
