import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Video } from './VideoExtension';
import { useRef, useEffect } from 'react';
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
  Heading2,
  Image as ImageIcon,
  Video as VideoIcon
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onUploadMedia?: (file: File) => Promise<string | null>;
}

const MenuBar = ({ editor, onUploadMedia }: { editor: any, onUploadMedia?: (file: File) => Promise<string | null> }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaTypeRef = useRef<'image' | 'video'>('image');

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUploadMedia) {
      const file = e.target.files[0];
      const url = await onUploadMedia(file);
      if (url) {
        if (mediaTypeRef.current === 'image') {
          editor.chain().focus().setImage({ src: url }).run();
        } else {
          editor.chain().focus().setVideo({ src: url }).run();
        }
      }
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerUpload = (type: 'image' | 'video') => {
    if (!onUploadMedia) {
      alert("La subida de medios no está configurada.");
      return;
    }
    mediaTypeRef.current = type;
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-[#1F1F1F] bg-[#0A0A0A] rounded-t-lg">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept={mediaTypeRef.current === 'image' ? 'image/*' : 'video/*'} 
      />
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
      <div className="w-px h-6 bg-[#1F1F1F] mx-1 self-center" />
      <button
        type="button"
        onClick={() => triggerUpload('image')}
        className="p-2 rounded hover:bg-[#1F1F1F] transition-colors text-[#888888]"
        title="Añadir Imagen"
      >
        <ImageIcon size={16} />
      </button>
      <button
        type="button"
        onClick={() => triggerUpload('video')}
        className="p-2 rounded hover:bg-[#1F1F1F] transition-colors text-[#888888]"
        title="Añadir Vídeo"
      >
        <VideoIcon size={16} />
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

export const RichTextEditor = ({ content, onChange, onUploadMedia }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl w-full my-6 object-cover shadow-2xl',
        },
      }),
      Video,
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
        class: 'prose prose-invert max-w-none min-h-[400px] p-6 outline-none font-primary text-base bg-[#0F0F0F] rounded-b-lg !whitespace-pre-wrap',
      },
      // @ts-ignore - parseOptions is valid in Prosemirror but might be missing in Tiptap's simplified types
      parseOptions: {
        preserveWhitespace: 'full',
      },
      transformPastedText(text: string) {
        // Convert double spaces to space + nbsp to prevent collapsing
        return text.replace(/  /g, ' \u00A0');
      },
      handlePaste(view: any, event: ClipboardEvent) {
        const text = event.clipboardData?.getData('text/plain');
        if (text && !event.clipboardData?.getData('text/html')) {
          // If only plain text is pasted, ensure it's handled as is
          const { state, dispatch } = view;
          const { tr } = state;
          // Split by lines and insert with breaks
          const lines = text.split('\n');
          lines.forEach((line, i) => {
            tr.insertText(line.replace(/  /g, ' \u00A0'));
            if (i < lines.length - 1) {
              tr.insertText('\n'); // This will be handled by HardBreak or whitespace-pre-wrap
            }
          });
          dispatch(tr);
          return true; // handled
        }
        return false;
      },
    } as any,
  });

  useEffect(() => {
    if (editor && content && content !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="w-full border border-[#1F1F1F] rounded-lg focus-within:border-[#C9A962] transition-colors">
      <MenuBar editor={editor} onUploadMedia={onUploadMedia} />
      <EditorContent editor={editor} />
    </div>
  );
};
