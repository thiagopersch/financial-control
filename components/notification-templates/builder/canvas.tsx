'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  BLOCK_TYPE_LABELS,
  type Block,
  type BlockTree,
  type BlockType,
  type ColumnChildBlock,
  type ContainerBlock,
  type RowBlock,
} from '@/lib/notification-templates/block-types';
import {
  addBlockToColumn,
  addBlockToContainer,
  addColumnToRow,
  createDefaultBlock,
  moveBlockInColumn,
  moveBlockInContainer,
  removeBlockFromColumn,
  removeBlockFromContainer,
  removeColumnFromRow,
  removeTopLevelBlock,
} from '@/lib/notification-templates/block-tree-utils';
import { renderBlockTreeToHtml } from '@/lib/notification-templates/render';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

const COLUMN_CHILD_TYPES: BlockType[] = ['text', 'image', 'table', 'button', 'divider'];

interface CanvasProps {
  blocks: BlockTree;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function Canvas({ blocks, setBlocks, selectedId, onSelect }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'canvas-top-level' });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-muted/20 min-h-[480px] flex-1 rounded-lg border border-dashed p-4',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      {blocks.length === 0 ? (
        <div className="text-muted-foreground flex h-full min-h-[440px] items-center justify-center text-center text-sm">
          Arraste elementos da paleta à esquerda para começar a montar o template.
        </div>
      ) : (
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          <div className="mx-auto flex max-w-[640px] flex-col gap-3">
            {blocks.map((block) => (
              <TopLevelBlockItem
                key={block.id}
                block={block}
                blocks={blocks}
                selectedId={selectedId}
                onSelect={onSelect}
                setBlocks={setBlocks}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  );
}

function TopLevelBlockItem({
  block,
  blocks,
  selectedId,
  onSelect,
  setBlocks,
}: {
  block: Block;
  blocks: BlockTree;
  selectedId: string | null;
  onSelect: (id: string) => void;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    data: { source: 'block' },
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const isSelected = selectedId === block.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        // A "button"/"image" block can render a real `<a href>` inside its
        // preview — prevent it from actually navigating while editing.
        e.preventDefault();
        onSelect(block.id);
      }}
      className={cn(
        'group bg-background relative cursor-pointer rounded-md border p-3 pt-5 pl-3 transition-colors',
        isSelected
          ? 'border-primary ring-primary/30 ring-2'
          : 'border-muted-foreground/40 hover:border-primary/60 border-dashed',
        isDragging && 'opacity-50',
      )}
    >
      <span className="text-muted-foreground bg-background absolute -top-2.5 left-2 flex items-center gap-1 rounded border px-1 text-[10px] font-medium">
        <GripVertical className="h-2.5 w-2.5" />
        {block.name || BLOCK_TYPE_LABELS[block.type]}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setBlocks((prev) => removeTopLevelBlock(prev, block.id));
          if (isSelected) onSelect('');
        }}
        className="text-muted-foreground hover:text-destructive absolute top-2 right-2 hidden cursor-pointer rounded p-1 group-hover:block"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      {block.type === 'row' ? (
        <RowView
          block={block}
          blocks={blocks}
          selectedId={selectedId}
          onSelect={onSelect}
          setBlocks={setBlocks}
        />
      ) : block.type === 'container' ? (
        <ContainerView
          block={block}
          blocks={blocks}
          selectedId={selectedId}
          onSelect={onSelect}
          setBlocks={setBlocks}
        />
      ) : (
        <div dangerouslySetInnerHTML={{ __html: renderBlockTreeToHtml([block]) }} />
      )}
    </div>
  );
}

function RowView({
  block,
  blocks,
  selectedId,
  onSelect,
  setBlocks,
}: {
  block: RowBlock;
  blocks: BlockTree;
  selectedId: string | null;
  onSelect: (id: string) => void;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
}) {
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-muted-foreground cursor-pointer text-xs font-medium hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(block.id);
          }}
        >
          {block.name || 'Linha'} · {block.children.length} coluna(s)
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 cursor-pointer gap-1 text-xs"
          onClick={(e) => {
            e.stopPropagation();
            setBlocks((prev) => addColumnToRow(prev, block.id));
          }}
          disabled={block.children.length >= 6}
        >
          <Plus className="h-3 w-3" /> Coluna
        </Button>
      </div>
      <div className="flex gap-2">
        {block.children.map((column) => (
          <ColumnDropZone
            key={column.id}
            rowId={block.id}
            columnId={column.id}
            blocks={blocks}
            widthPercent={column.props.widthPercent}
            children_={column.children}
            selectedId={selectedId}
            onSelect={onSelect}
            setBlocks={setBlocks}
            canRemove={block.children.length > 1}
          />
        ))}
      </div>
    </div>
  );
}

function ColumnDropZone({
  rowId,
  columnId,
  blocks,
  widthPercent,
  children_,
  selectedId,
  onSelect,
  setBlocks,
  canRemove,
}: {
  rowId: string;
  columnId: string;
  blocks: BlockTree;
  widthPercent: number;
  children_: ColumnChildBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
  canRemove: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${rowId}:${columnId}` });

  return (
    <div
      ref={setNodeRef}
      style={{ width: `${widthPercent}%` }}
      className={cn(
        'bg-background/60 flex min-h-[80px] flex-col gap-2 rounded-md border border-dashed p-2 pt-4',
        isOver && 'border-primary bg-primary/5',
      )}
    >
      {children_.map((child, index) => {
        const isSelected = selectedId === child.id;
        return (
          <div
            key={child.id}
            onClick={(e) => {
              // A "button"/"image" block can render a real `<a href>` inside
              // its preview — prevent it from actually navigating while editing.
              e.preventDefault();
              e.stopPropagation();
              onSelect(child.id);
            }}
            className={cn(
              'group/child relative cursor-pointer rounded border p-1.5',
              isSelected
                ? 'border-primary ring-primary/30 ring-1'
                : 'border-muted-foreground/30 hover:border-primary/60 border-dashed',
            )}
          >
            <span className="text-muted-foreground bg-background absolute -top-2.5 left-1 rounded border px-1 text-[10px] font-medium">
              {child.name || BLOCK_TYPE_LABELS[child.type]}
            </span>
            <div className="absolute -top-1 -right-1 hidden gap-0.5 group-hover/child:flex">
              <button
                type="button"
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  setBlocks((prev) => moveBlockInColumn(prev, rowId, columnId, index, index - 1));
                }}
                className="bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border p-0.5 disabled:opacity-30"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={index === children_.length - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  setBlocks((prev) => moveBlockInColumn(prev, rowId, columnId, index, index + 1));
                }}
                className="bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border p-0.5 disabled:opacity-30"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setBlocks((prev) => removeBlockFromColumn(prev, rowId, columnId, child.id));
                  if (isSelected) onSelect('');
                }}
                className="bg-background text-muted-foreground hover:text-destructive cursor-pointer rounded border p-0.5"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: renderBlockTreeToHtml([child]) }} />
          </div>
        );
      })}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 cursor-pointer gap-1 text-xs"
          >
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {COLUMN_CHILD_TYPES.map((type) => (
            <DropdownMenuItem
              key={type}
              onSelect={() => {
                const newBlock = createDefaultBlock(type, blocks) as ColumnChildBlock;
                setBlocks((prev) => addBlockToColumn(prev, rowId, columnId, newBlock));
                onSelect(newBlock.id);
              }}
            >
              {BLOCK_TYPE_LABELS[type]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive h-6 cursor-pointer gap-1 text-xs"
          onClick={() => setBlocks((prev) => removeColumnFromRow(prev, rowId, columnId))}
        >
          <Trash2 className="h-3 w-3" /> Remover coluna
        </Button>
      )}
    </div>
  );
}

function ContainerView({
  block,
  blocks,
  selectedId,
  onSelect,
  setBlocks,
}: {
  block: ContainerBlock;
  blocks: BlockTree;
  selectedId: string | null;
  onSelect: (id: string) => void;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `container:${block.id}` });

  const isFlex = block.props.display === 'flex';
  const childrenStyle: React.CSSProperties = isFlex
    ? {
        display: 'flex',
        flexDirection: block.props.flexDirection ?? 'row',
        flexWrap: block.props.flexWrap ?? 'nowrap',
        justifyContent: block.props.justifyContent ?? 'flex-start',
        alignItems: block.props.alignItems ?? 'stretch',
        gap: `${block.props.gap ?? 0}${block.props.gapUnit ?? 'px'}`,
      }
    : {};

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <span
        className="text-muted-foreground mb-2 block cursor-pointer text-xs font-medium hover:underline"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(block.id);
        }}
      >
        {block.name || 'Contêiner'}
      </span>
      <div
        ref={setNodeRef}
        className={cn(
          'bg-background/60 min-h-[80px] rounded-md border border-dashed p-2 pt-4',
          isOver && 'border-primary bg-primary/5',
        )}
      >
        <div style={childrenStyle} className={cn(!isFlex && 'flex flex-col gap-2')}>
          {block.children.map((child, index) => {
            const isSelected = selectedId === child.id;
            return (
              <div
                key={child.id}
                onClick={(e) => {
                  // A "button"/"image" block can render a real `<a href>`
                  // inside its preview — prevent it from actually navigating
                  // while editing.
                  e.preventDefault();
                  e.stopPropagation();
                  onSelect(child.id);
                }}
                className={cn(
                  'group/child relative cursor-pointer rounded border p-1.5',
                  isSelected
                    ? 'border-primary ring-primary/30 ring-1'
                    : 'border-muted-foreground/30 hover:border-primary/60 border-dashed',
                )}
              >
                <span className="text-muted-foreground bg-background absolute -top-2.5 left-1 rounded border px-1 text-[10px] font-medium">
                  {child.name || BLOCK_TYPE_LABELS[child.type]}
                </span>
                <div className="absolute -top-1 -right-1 hidden gap-0.5 group-hover/child:flex">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlocks((prev) => moveBlockInContainer(prev, block.id, index, index - 1));
                    }}
                    className="bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border p-0.5 disabled:opacity-30"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    disabled={index === block.children.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlocks((prev) => moveBlockInContainer(prev, block.id, index, index + 1));
                    }}
                    className="bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border p-0.5 disabled:opacity-30"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setBlocks((prev) => removeBlockFromContainer(prev, block.id, child.id));
                      if (isSelected) onSelect('');
                    }}
                    className="bg-background text-muted-foreground hover:text-destructive cursor-pointer rounded border p-0.5"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div dangerouslySetInnerHTML={{ __html: renderBlockTreeToHtml([child]) }} />
              </div>
            );
          })}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2 h-7 cursor-pointer gap-1 text-xs"
            >
              <Plus className="h-3 w-3" /> Adicionar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {COLUMN_CHILD_TYPES.map((type) => (
              <DropdownMenuItem
                key={type}
                onSelect={() => {
                  const newBlock = createDefaultBlock(type, blocks) as ColumnChildBlock;
                  setBlocks((prev) => addBlockToContainer(prev, block.id, newBlock));
                  onSelect(newBlock.id);
                }}
              >
                {BLOCK_TYPE_LABELS[type]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
