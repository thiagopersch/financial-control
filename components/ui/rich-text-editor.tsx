'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { VariableCatalogPage } from '@/lib/notification-templates/variable-catalog';
import { cn } from '@/lib/utils';
import Color from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  Strikethrough,
  Underline as UnderlineIcon,
  Variable,
} from 'lucide-react';
import { useRef, useState } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Rendered as a row of buttons below the toolbar that insert `{{key}}` at the cursor. */
  variables?: { label: string; key: string }[];
  /** When provided, renders a single "Adicionar variável" button with a page > field submenu instead of `variables`. */
  variableGroups?: VariableCatalogPage[];
}

const HEADING_OPTIONS = [
  { value: 'paragraph', label: 'Normal' },
  { value: '1', label: 'Título 1' },
  { value: '2', label: 'Título 2' },
  { value: '3', label: 'Título 3' },
] as const;

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  variables,
  variableGroups,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded-md' } }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-32 px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const handleInsertImage = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/notification-templates/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        editor.chain().focus().setImage({ src: data.url }).run();
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleInsertLink = () => {
    if (!editor) return;
    const url = window.prompt('URL do link:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleInsertVariable = (key: string) => {
    editor?.chain().focus().insertContent(`{{${key}}}`).run();
  };

  const handleHeadingChange = (v: string) => {
    if (!editor) return;
    if (v === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .setHeading({ level: Number(v) as 1 | 2 | 3 })
        .run();
    }
  };

  const currentHeading = editor
    ? (HEADING_OPTIONS.find(
        (o) => o.value !== 'paragraph' && editor.isActive('heading', { level: Number(o.value) }),
      )?.value ?? 'paragraph')
    : 'paragraph';

  if (!editor) return null;

  return (
    <div className="rounded-md border">
      {variableGroups && variableGroups.length > 0 ? (
        <div className="flex items-center gap-1 border-b p-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                <Variable className="h-3.5 w-3.5" />
                Adicionar variável
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {variableGroups.map((page) => (
                <DropdownMenuSub key={page.id}>
                  <DropdownMenuSubTrigger>{page.label}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {page.fields.map((field) => (
                      <DropdownMenuItem
                        key={field.key}
                        onSelect={() => handleInsertVariable(field.key)}
                      >
                        {field.label}
                        <span className="text-muted-foreground ml-auto text-xs">{`{{${field.key}}}`}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        variables &&
        variables.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 border-b p-1.5">
            {variables.map((v) => (
              <Button
                key={v.key}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleInsertVariable(v.key)}
              >
                {v.label}
              </Button>
            ))}
          </div>
        )
      )}
      <div className="flex flex-wrap items-center gap-1 border-b p-1.5">
        <Select value={currentHeading} onValueChange={handleHeadingChange}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HEADING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('bold') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('italic') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('underline') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('strike') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('bulletList') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('orderedList') && 'bg-accent')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive({ textAlign: 'left' }) && 'bg-accent')}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive({ textAlign: 'center' }) && 'bg-accent')}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive({ textAlign: 'right' }) && 'bg-accent')}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <label
          title="Cor do texto"
          className="border-input relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border"
        >
          <span
            className="text-xs font-bold"
            style={{ color: editor.getAttributes('textStyle').color || 'currentColor' }}
          >
            A
          </span>
          <input
            type="color"
            value={editor.getAttributes('textStyle').color || '#000000'}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', editor.isActive('link') && 'bg-accent')}
          onClick={handleInsertLink}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleInsertImage}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
}
