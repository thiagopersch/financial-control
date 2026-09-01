'use client';

import { RichTextEditor } from '@/components/ui/rich-text-editor';
import type {
  ButtonBlock,
  ColumnChildBlock,
  DividerBlock,
  ImageBlock,
  TableBlock,
  TextBlock,
} from '@/lib/notification-templates/block-types';
import { resolveThemeColor } from '@/lib/notification-templates/theme-color';
import { VARIABLE_CATALOG } from '@/lib/notification-templates/variable-catalog';
import { cn } from '@/lib/utils';
import { ImageIcon, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Resizable } from 're-resizable';
import { VariablePicker } from './variable-picker';

const alignToFlex: Record<string, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
};

function TextBlockView({
  block,
  isSelected,
  onChange,
}: {
  block: TextBlock;
  isSelected: boolean;
  onChange: (html: string) => void;
}) {
  if (isSelected) {
    return (
      <RichTextEditor
        value={block.props.html}
        onChange={onChange}
        variableGroups={VARIABLE_CATALOG}
      />
    );
  }
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none cursor-text px-1 py-1"
      dangerouslySetInnerHTML={{ __html: block.props.html }}
    />
  );
}

function ImageBlockView({
  block,
  isSelected,
  onChangeSrc,
  onResize,
}: {
  block: ImageBlock;
  isSelected: boolean;
  onChangeSrc: (src: string) => void;
  onResize: (width: number, height: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/notification-templates/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) onChangeSrc(data.url);
    } finally {
      setIsUploading(false);
    }
  };

  if (!block.props.src) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-8">
        <ImageIcon className="text-muted-foreground h-6 w-6" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-primary inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <Upload className="h-3.5 w-3.5" />
          {isUploading ? 'Enviando...' : 'Enviar imagem'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    );
  }

  const widthUnit = block.props.widthUnit ?? 'px';
  const heightUnit = block.props.heightUnit ?? 'px';
  const cssWidth = block.props.width
    ? `${block.props.width}${widthUnit === '%' ? '%' : 'px'}`
    : 'auto';
  const cssHeight = block.props.height
    ? `${block.props.height}${heightUnit === '%' ? '%' : 'px'}`
    : 'auto';

  if (!isSelected) {
    return (
      <div style={{ display: 'flex', justifyContent: alignToFlex[block.props.align] }}>
        <img
          src={block.props.src}
          alt={block.props.alt}
          style={{
            width: cssWidth,
            height: cssHeight,
            maxWidth: '100%',
            borderRadius: `${block.props.borderRadius}px`,
          }}
        />
      </div>
    );
  }

  // The drag-resize handle always works in px (a percentage handle would need
  // to know the container's pixel width, which the builder canvas doesn't
  // expose) — the property panel is where % sizing is set.
  const resizableWidth = widthUnit === 'px' ? (block.props.width ?? 240) : 240;
  const resizableHeight = heightUnit === 'px' ? (block.props.height ?? 'auto') : 'auto';

  return (
    <div style={{ display: 'flex', justifyContent: alignToFlex[block.props.align] }}>
      <Resizable
        size={{ width: resizableWidth, height: resizableHeight }}
        lockAspectRatio
        onResizeStop={(_e, _direction, ref) => {
          onResize(ref.offsetWidth, ref.offsetHeight);
        }}
        className="!max-w-full"
      >
        <img
          src={block.props.src}
          alt={block.props.alt}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: `${block.props.borderRadius}px`,
          }}
        />
      </Resizable>
    </div>
  );
}

function ButtonBlockView({ block }: { block: ButtonBlock }) {
  return (
    <div style={{ display: 'flex', justifyContent: alignToFlex[block.props.align] }}>
      <span
        style={{
          display: 'inline-block',
          backgroundColor: resolveThemeColor(block.props.bgColor),
          color: resolveThemeColor(block.props.textColor),
          borderRadius: `${block.props.radius}px`,
          padding: `${block.props.paddingY}px ${block.props.paddingX}px`,
          fontWeight: 600,
          fontSize: '14px',
        }}
      >
        {block.props.label || 'Botão'}
      </span>
    </div>
  );
}

function DividerBlockView({ block }: { block: DividerBlock }) {
  return (
    <hr
      style={{
        border: 'none',
        borderTop: `${block.props.thickness}px solid ${resolveThemeColor(block.props.color)}`,
        margin: `${block.props.marginY}px 0`,
      }}
    />
  );
}

function TableBlockView({
  block,
  onChangeCell,
}: {
  block: TableBlock;
  onChangeCell: (row: number, col: number, value: string) => void;
}) {
  return (
    <table className="w-full border-collapse text-sm">
      <tbody>
        {block.props.cells.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, colIndex) => {
              const isHeader = block.props.hasHeader && rowIndex === 0;
              return (
                <td key={colIndex} className={cn('border p-0', isHeader && 'bg-muted/50')}>
                  <div className="flex items-center gap-0.5 pr-0.5">
                    <input
                      value={cell}
                      onChange={(e) => onChangeCell(rowIndex, colIndex, e.target.value)}
                      className={cn(
                        'w-full bg-transparent px-2 py-1.5 outline-none',
                        isHeader && 'font-semibold',
                      )}
                    />
                    <VariablePicker
                      iconOnly
                      label="Adicionar variável"
                      onInsert={(key) => onChangeCell(rowIndex, colIndex, `${cell}{{${key}}}`)}
                    />
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface ColumnChildRendererProps {
  block: ColumnChildBlock;
  isSelected: boolean;
  onChange: (block: ColumnChildBlock) => void;
}

export function ColumnChildRenderer({ block, isSelected, onChange }: ColumnChildRendererProps) {
  switch (block.type) {
    case 'text':
      return (
        <TextBlockView
          block={block}
          isSelected={isSelected}
          onChange={(html) => onChange({ ...block, props: { ...block.props, html } })}
        />
      );
    case 'image':
      return (
        <ImageBlockView
          block={block}
          isSelected={isSelected}
          onChangeSrc={(src) => onChange({ ...block, props: { ...block.props, src } })}
          onResize={(width, height) =>
            onChange({
              ...block,
              props: { ...block.props, width, height, widthUnit: 'px', heightUnit: 'px' },
            })
          }
        />
      );
    case 'button':
      return <ButtonBlockView block={block} />;
    case 'divider':
      return <DividerBlockView block={block} />;
    case 'table':
      return (
        <TableBlockView
          block={block}
          onChangeCell={(row, col, value) => {
            const cells = block.props.cells.map((r, ri) =>
              ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r,
            );
            onChange({ ...block, props: { ...block.props, cells } });
          }}
        />
      );
  }
}
