'use client';

import { useDraggable } from '@dnd-kit/core';
import { BLOCK_TYPE_LABELS, type BlockType } from '@/lib/notification-templates/block-types';
import { cn } from '@/lib/utils';
import {
  Box,
  Columns3,
  Divide,
  Image as ImageIcon,
  RectangleHorizontal,
  Table2,
  Type,
} from 'lucide-react';

export const PALETTE_ITEMS: {
  type: BlockType;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { type: 'text', icon: Type },
  { type: 'image', icon: ImageIcon },
  { type: 'row', icon: Columns3 },
  { type: 'container', icon: Box },
  { type: 'table', icon: Table2 },
  { type: 'button', icon: RectangleHorizontal },
  { type: 'divider', icon: Divide },
];

export const PALETTE_ICON_BY_TYPE: Record<
  BlockType,
  React.ComponentType<{ className?: string }>
> = Object.fromEntries(PALETTE_ITEMS.map((item) => [item.type, item.icon])) as Record<
  BlockType,
  React.ComponentType<{ className?: string }>
>;

export function BlockTypeCard({ type, className }: { type: BlockType; className?: string }) {
  const Icon = PALETTE_ICON_BY_TYPE[type];
  return (
    <div
      className={cn(
        'border-input bg-card flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium',
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {BLOCK_TYPE_LABELS[type]}
    </div>
  );
}

function PaletteItem({ type }: { type: BlockType }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { source: 'palette', blockType: type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      {...listeners}
      {...attributes}
      className={cn(
        'w-full text-left transition-colors',
        'hover:[&>div]:border-primary/50 hover:[&>div]:bg-accent',
        isDragging && 'opacity-40',
      )}
    >
      <BlockTypeCard type={type} />
    </button>
  );
}

export function BlockPalette() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        Elementos
      </p>
      <div className="flex flex-col gap-2">
        {PALETTE_ITEMS.map((item) => (
          <PaletteItem key={item.type} type={item.type} />
        ))}
      </div>
      <p className="text-muted-foreground text-xs">Arraste um elemento para o canvas ao lado.</p>
    </div>
  );
}
