'use client';

import { useDraggable } from '@dnd-kit/core';
import { BLOCK_TYPE_LABELS, type BlockType } from '@/lib/notification-templates/block-types';
import { cn } from '@/lib/utils';
import {
  Box,
  ChartColumnBig,
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
  group: 'structure' | 'content';
  description: string;
}[] = [
  { type: 'row', icon: Columns3, group: 'structure', description: 'Colunas lado a lado' },
  { type: 'container', icon: Box, group: 'structure', description: 'Agrupa e alinha elementos' },
  { type: 'text', icon: Type, group: 'content', description: 'Parágrafos e títulos' },
  { type: 'image', icon: ImageIcon, group: 'content', description: 'Logo, banner ou foto' },
  { type: 'button', icon: RectangleHorizontal, group: 'content', description: 'Chamada para ação' },
  { type: 'table', icon: Table2, group: 'content', description: 'Tabela estática' },
  { type: 'divider', icon: Divide, group: 'content', description: 'Linha separadora' },
  { type: 'data', icon: ChartColumnBig, group: 'content', description: 'Listas e gráficos' },
];

const PALETTE_GROUPS = [
  { key: 'structure', label: 'Estrutura' },
  { key: 'content', label: 'Conteúdo' },
] as const;

export const PALETTE_ICON_BY_TYPE: Record<
  BlockType,
  React.ComponentType<{ className?: string }>
> = Object.fromEntries(PALETTE_ITEMS.map((item) => [item.type, item.icon])) as Record<
  BlockType,
  React.ComponentType<{ className?: string }>
>;

export function BlockTypeCard({
  type,
  label,
  description,
  className,
}: {
  type: BlockType;
  label?: string;
  description?: string;
  className?: string;
}) {
  const Icon = PALETTE_ICON_BY_TYPE[type];
  return (
    <div
      className={cn(
        'border-input bg-card flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs transition-colors',
        className,
      )}
    >
      <span className="bg-muted text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-md">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{label ?? BLOCK_TYPE_LABELS[type]}</span>
        {description && (
          <span className="text-muted-foreground truncate text-[11px]">{description}</span>
        )}
      </span>
    </div>
  );
}

function PaletteItem({
  type,
  description,
  onAdd,
}: {
  type: BlockType;
  description: string;
  onAdd: (type: BlockType) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${type}`,
    data: { kind: 'palette', blockType: type },
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      title="Arraste para o canvas ou clique para adicionar"
      onClick={() => onAdd(type)}
      {...listeners}
      {...attributes}
      className={cn(
        'w-full cursor-grab touch-none text-left active:cursor-grabbing',
        'hover:[&>div]:border-primary/50 hover:[&>div]:bg-accent',
        isDragging && 'opacity-40',
      )}
    >
      <BlockTypeCard type={type} description={description} />
    </button>
  );
}

export function BlockPalette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      {PALETTE_GROUPS.map((group) => (
        <div key={group.key} className="flex flex-col gap-2">
          <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            {group.label}
          </p>
          {PALETTE_ITEMS.filter((item) => item.group === group.key).map((item) => (
            <PaletteItem
              key={item.type}
              type={item.type}
              description={item.description}
              onAdd={onAdd}
            />
          ))}
        </div>
      ))}
      <p className="text-muted-foreground text-xs leading-relaxed">
        Arraste para o canvas — ou para dentro de um contêiner/coluna. Clique para adicionar junto
        ao elemento selecionado.
      </p>
    </div>
  );
}
