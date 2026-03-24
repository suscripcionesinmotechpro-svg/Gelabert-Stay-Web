import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Unlink,
  Undo,
  Redo,
  Heading1,
  Heading2
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-[#1F1F1F] bg-[#0A0A0A] rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-[#1F1F1F] transition-colors ${editor.isActive('bold') ? 'text-[#C9A962] bg-[#1F1F1F]' : 'text-[#888888]'}`}
        title="Negrita"
      >
        <Bold size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-[#1F1F1F] transition-colors ${editor.isActive('italic') ? 'text-[#C9A962] bg-[#1F1F1F]' : 'text-[#888888]'}`}
        title="Cursiva"
      >
        <Italic size={16} />
      </button>
      <div className="w-px h-6 bg-[#1F1F1F] mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-[#1F1F1F] transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-[#C9A962] bg-[#1F1F1F]' : 'text-[#888888]'}`}
        title="Título 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-[#1F1F1F] transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-[#C9A962] bg-[#1F1F1F]' : 'text-[#888888]'}`}
        title="Título 2"
      >
        <Heading2 size={16} />
      </button>
      <div className="w-px h-6 bg-[#1F1F1F] mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-[#1F1F1F] transition-colors ${editor.isActive('bulletList') ? 'text-[#C9A962] bg-[#1F1F1F]' : 'text-[#888888]'}`}
        title="Lista"
      >
        <List size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-[#1F1F1F] transition-colors ${editor.isActive('orderedList') ? 'text-[#C9A962] bg-[#1F1F1F]' : 'text-[#888888]'}`}
        title="Lista numerada"
      >
        <ListOrdered size={16} />
      </button>
      <div className="w-px h-6 bg-[#1F1F1F] mx-1 self-center" />
      <button
        type="button"
        onClick={addLink}
        className={`p-2 rounded hover:bg-[#1F1F1F] transition-colors ${editor.isActive('link') ? 'text-[#C9A962] bg-[#1F1F1F]' : 'text-[#888888]'}`}
        title="Insertar enlace"
      >
        <LinkIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
        className="p-2 rounded hover:bg-[#1F1F1F] transition-colors text-[#888888] disabled:opacity-30"
        title="Quitar enlace"
      >
        <Unlink size={16} />
      </button>
      <div className="flex-1" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        className="p-2 rounded hover:bg-[#1F1F1F] transition-colors text-[#888888]"
        title="Deshacer"
      >
        <Undo size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        className="p-2 rounded hover:bg-[#1F1F1F] transition-colors text-[#888888]"
        title="Rehacer"
      >
        <Redo size={16} />
      </button>
    </div>
  );
};

export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[#C9A962] underline cursor-pointer',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[200px] p-4 outline-none font-primary text-sm bg-[#0F0F0F] rounded-b-lg',
      },
    },
  });

  return (
    <div className="w-full border border-[#1F1F1F] rounded-lg focus-within:border-[#C9A962] transition-colors">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};
