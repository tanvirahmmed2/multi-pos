'use client'
import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  BiBold,
  BiItalic,
  BiStrikethrough,
  BiListUl,
  BiListOl,
  BiSolidQuoteLeft,
  BiUndo,
  BiRedo,
  BiMinus
} from 'react-icons/bi'

export default function TiptapEditor({ content = '', onChange, placeholder = 'Write notice details here...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      if (onChange) {
        onChange(html)
      }
    },
    immediatelyRender: false
  })

  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content || '')
    }
  }, [content, editor])

  if (!editor) {
    return (
      <div className="w-full border border-slate-200 p-4 min-h-[220px] bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-semibold">
        Loading Tiptap Rich Text Editor...
      </div>
    )
  }

  return (
    <div className="w-full border border-slate-300 bg-white flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 select-none">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 border transition cursor-pointer text-sm ${
            editor.isActive('bold')
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Bold"
        >
          <BiBold />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 border transition cursor-pointer text-sm ${
            editor.isActive('italic')
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Italic"
        >
          <BiItalic />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 border transition cursor-pointer text-sm ${
            editor.isActive('strike')
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Strikethrough"
        >
          <BiStrikethrough />
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 border transition cursor-pointer text-xs font-bold ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 border transition cursor-pointer text-xs font-bold ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 border transition cursor-pointer text-xs font-bold ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Heading 3"
        >
          H3
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 border transition cursor-pointer text-sm ${
            editor.isActive('bulletList')
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Bullet List"
        >
          <BiListUl />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 border transition cursor-pointer text-sm ${
            editor.isActive('orderedList')
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Ordered List"
        >
          <BiListOl />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 border transition cursor-pointer text-sm ${
            editor.isActive('blockquote')
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-200'
          }`}
          title="Blockquote"
        >
          <BiSolidQuoteLeft />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 border bg-white text-slate-700 border-slate-200 hover:bg-slate-200 transition cursor-pointer text-sm"
          title="Horizontal Line"
        >
          <BiMinus />
        </button>

        <div className="h-5 w-[1px] bg-slate-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 border bg-white text-slate-700 border-slate-200 hover:bg-slate-200 disabled:opacity-40 transition cursor-pointer text-sm"
          title="Undo"
        >
          <BiUndo />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 border bg-white text-slate-700 border-slate-200 hover:bg-slate-200 disabled:opacity-40 transition cursor-pointer text-sm"
          title="Redo"
        >
          <BiRedo />
        </button>
      </div>

      {/* Editor Body */}
      <div className="p-4 min-h-[220px] max-h-[500px] overflow-y-auto prose prose-sm max-w-none focus:outline-none text-slate-800 font-sans leading-relaxed">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
