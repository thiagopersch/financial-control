'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  addColumnToRow,
  canDropAt,
  createDefaultBlock,
  duplicateBlock,
  getChildrenAt,
  insertBlockAt,
  isSameLocation,
  listDropTargets,
  moveBlock,
  moveBlockByOffset,
  removeBlockAnywhere,
  removeColumnFromRow,
  type BlockLocation,
} from '@/lib/notification-templates/block-tree-utils';
import {
  BLOCK_TYPE_LABELS,
  type Block,
  type BlockTree,
  type ColumnChildBlock,
  type ContainerBlock,
  type RowBlock,
} from '@/lib/notification-templates/block-types';
import { renderBlockTreePreviewHtml } from '@/lib/notification-templates/render';
import { resolveThemeColor } from '@/lib/notification-templates/theme-color';
import { cn } from '@/lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  FolderInput,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type CSSProperties,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { PALETTE_ICON_BY_TYPE, PALETTE_ITEMS } from './block-palette';
import {
  blockDroppableId,
  listDroppableId,
  type DragData,
  type DropTarget,
  type ListAxis,
} from './use-builder-dnd';

interface CanvasContextValue {
  blocks: BlockTree;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (id: string) => void;
  activeDrag: DragData | null;
  dropTarget: DropTarget | null;
  useAppTheme: boolean;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export const CanvasProvider = CanvasContext.Provider;

function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvas must be used inside <CanvasProvider>');
  return ctx;
}

const VERTICAL: ListAxis = { axis: 'y', reverse: false };

function containerAxis(block: ContainerBlock): ListAxis {
  if (block.props.display !== 'flex') return VERTICAL;
  const direction = block.props.flexDirection ?? 'row';
  return {
    axis: direction.startsWith('row') ? 'x' : 'y',
    reverse: direction.endsWith('reverse'),
  };
}

/** Registers a list (canvas, column or container) as a drop zone. */
export function useListDroppable(location: BlockLocation, axis: ListAxis = VERTICAL) {
  const { activeDrag, dropTarget } = useCanvas();
  const { setNodeRef } = useDroppable({
    id: listDroppableId(location),
    data: { kind: 'list', location, ...axis },
  });
  return {
    setNodeRef,
    isDragging: !!activeDrag,
    accepts: !!activeDrag && canDropAt(activeDrag.blockType, location),
    isTarget: !!dropTarget && isSameLocation(dropTarget.location, location),
  };
}

/** Renders the blocks of a list with the insertion indicator and an empty drop placeholder. */
export function CanvasItems({
  location,
  items,
  axis = VERTICAL,
  emptyLabel,
}: {
  location: BlockLocation;
  items: (Block | ColumnChildBlock)[];
  axis?: ListAxis;
  emptyLabel: string;
}) {
  const { dropTarget, activeDrag } = useCanvas();
  const isTarget = !!dropTarget && isSameLocation(dropTarget.location, location);

  if (items.length === 0) {
    const accepts = !!activeDrag && canDropAt(activeDrag.blockType, location);
    return (
      <div
        className={cn(
          'text-muted-foreground flex min-h-14 w-full flex-1 items-center justify-center rounded-md border border-dashed px-3 py-4 text-center text-xs transition-colors',
          isTarget
            ? 'border-sky-500 bg-sky-500/10 text-sky-700'
            : accepts
              ? 'border-primary/50 bg-primary/5'
              : 'border-muted-foreground/30',
        )}
      >
        {activeDrag && !accepts ? 'Linha e Contêiner só no nível principal' : emptyLabel}
      </div>
    );
  }

  return (
    <>
      {items.map((block, index) => (
        <CanvasBlock
          key={block.id}
          block={block}
          location={location}
          index={index}
          siblingsCount={items.length}
          axis={axis}
          indicator={
            !isTarget
              ? null
              : dropTarget.index === index
                ? 'before'
                : dropTarget.index === items.length && index === items.length - 1
                  ? 'after'
                  : null
          }
        />
      ))}
    </>
  );
}

function DropIndicator({ side, axis }: { side: 'before' | 'after'; axis: ListAxis }) {
  const atStart = side === 'before' ? !axis.reverse : axis.reverse;
  return (
    <span
      aria-hidden
      className={cn(
        'pointer-events-none absolute z-30 rounded-full bg-sky-500 shadow-[0_0_0_2px_rgba(14,165,233,0.25)]',
        'before:absolute before:size-2 before:rounded-full before:bg-sky-500',
        axis.axis === 'y'
          ? cn(
              '-inset-x-1 h-[3px] before:-top-[2.5px] before:-left-1',
              atStart ? '-top-[9px]' : '-bottom-[9px]',
            )
          : cn(
              '-inset-y-1 w-[3px] before:-top-1 before:-left-[2.5px]',
              atStart ? '-left-[9px]' : '-right-[9px]',
            ),
      )}
    />
  );
}

const STRUCTURE_STYLES = {
  container: {
    border: 'border-violet-500/50',
    tab: 'bg-violet-600 text-white border-violet-600',
  },
  row: {
    border: 'border-amber-500/60',
    tab: 'bg-amber-500 text-white border-amber-500',
  },
} as const;

function CanvasBlock({
  block,
  location,
  index,
  siblingsCount,
  axis,
  indicator,
}: {
  block: Block | ColumnChildBlock;
  location: BlockLocation;
  index: number;
  siblingsCount: number;
  axis: ListAxis;
  indicator: 'before' | 'after' | null;
}) {
  const { selectedId, onSelect, onEdit, useAppTheme } = useCanvas();
  const isSelected = selectedId === block.id;
  const isStructure = block.type === 'container' || block.type === 'row';
  const structure = isStructure ? STRUCTURE_STYLES[block.type as 'container' | 'row'] : null;
  const Icon = PALETTE_ICON_BY_TYPE[block.type];
  const label = block.name || BLOCK_TYPE_LABELS[block.type];

  const {
    setNodeRef: setDragRef,
    setActivatorNodeRef,
    listeners,
    attributes,
    isDragging,
  } = useDraggable({
    id: block.id,
    data: { kind: 'block', blockType: block.type, blockId: block.id, name: label },
  });
  const { setNodeRef: setDropRef } = useDroppable({
    id: blockDroppableId(block.id),
    data: { kind: 'block', blockId: block.id, location, ...axis },
  });
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      setDragRef(node);
      setDropRef(node);
    },
    [setDragRef, setDropRef],
  );

  return (
    <motion.div
      ref={ref}
      layout="position"
      transition={{ duration: 0.18, ease: 'easeOut' }}
      data-canvas-block
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
        onEdit(block.id);
      }}
      className={cn(
        'group/block relative min-w-0 cursor-pointer rounded-md border bg-transparent transition-[border-color,box-shadow,opacity]',
        isStructure ? 'p-2 pt-5' : 'px-2 pt-4 pb-2',
        isSelected
          ? 'border-primary ring-primary/25 border-solid ring-2'
          : cn(
              'border-dashed',
              structure?.border ?? 'border-muted-foreground/35',
              // Highlight only the innermost hovered block, not its ancestors.
              '[&:hover:not(:has([data-canvas-block]:hover))]:border-primary/70 [&:hover:not(:has([data-canvas-block]:hover))]:border-solid',
            ),
        isDragging && 'opacity-35',
      )}
    >
      {indicator && <DropIndicator side={indicator} axis={axis} />}

      <span
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        title="Arraste para mover"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(block.id);
        }}
        className={cn(
          'absolute -top-2.5 left-2 z-20 flex max-w-[70%] cursor-grab touch-none items-center gap-1 rounded border px-1.5 py-px text-[10px] leading-4 font-semibold shadow-xs select-none active:cursor-grabbing',
          structure?.tab ??
            (isSelected
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground'),
        )}
      >
        <GripVertical className="h-3 w-3 shrink-0 opacity-70" />
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{label}</span>
      </span>

      <BlockActions
        block={block}
        location={location}
        index={index}
        siblingsCount={siblingsCount}
        visible={isSelected}
      />

      {block.type === 'container' ? (
        <ContainerBody block={block} />
      ) : block.type === 'row' ? (
        <RowBody block={block} />
      ) : (
        <LeafPreview block={block} framed={useAppTheme} />
      )}
    </motion.div>
  );
}

function LeafPreview({ block, framed }: { block: Block | ColumnChildBlock; framed: boolean }) {
  const html = useMemo(() => renderBlockTreePreviewHtml([block as Block]), [block]);
  return (
    <div
      // Links/buttons in the preview must not navigate while editing.
      className={cn('pointer-events-none select-none', framed && 'rounded-sm bg-white p-1')}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  destructive,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        'text-muted-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors disabled:cursor-not-allowed disabled:opacity-30',
        destructive
          ? 'hover:bg-destructive/10 hover:text-destructive'
          : 'hover:bg-accent hover:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

function BlockActions({
  block,
  location,
  index,
  siblingsCount,
  visible,
}: {
  block: Block | ColumnChildBlock;
  location: BlockLocation;
  index: number;
  siblingsCount: number;
  visible: boolean;
}) {
  const { blocks, setBlocks, selectedId, onSelect, onEdit } = useCanvas();
  const moveTargets = useMemo(
    () => listDropTargets(blocks, block.type).filter((t) => !isSameLocation(t.location, location)),
    [blocks, block.type, location],
  );

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'bg-background absolute -top-3.5 right-2 z-20 flex items-center gap-0.5 rounded-md border p-0.5 shadow-sm transition-opacity',
        visible
          ? 'opacity-100'
          : cn(
              'pointer-events-none opacity-0',
              // Show on hover of this block only — not while a nested block is hovered.
              '[[data-canvas-block]:hover:not(:has([data-canvas-block]:hover))>&]:pointer-events-auto [[data-canvas-block]:hover:not(:has([data-canvas-block]:hover))>&]:opacity-100',
            ),
      )}
    >
      <ActionButton
        label="Mover para cima"
        disabled={index === 0}
        onClick={() => setBlocks((prev) => moveBlockByOffset(prev, block.id, -1))}
      >
        <ArrowUp className="h-3.5 w-3.5" />
      </ActionButton>
      <ActionButton
        label="Mover para baixo"
        disabled={index === siblingsCount - 1}
        onClick={() => setBlocks((prev) => moveBlockByOffset(prev, block.id, 1))}
      >
        <ArrowDown className="h-3.5 w-3.5" />
      </ActionButton>

      {moveTargets.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Mover para…"
              aria-label="Mover para…"
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground hover:bg-accent hover:text-foreground flex h-6 w-6 cursor-pointer items-center justify-center rounded"
            >
              <FolderInput className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel className="text-xs">Mover para</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {moveTargets.map((target) => (
              <DropdownMenuItem
                key={target.label + JSON.stringify(target.location)}
                onSelect={() =>
                  setBlocks((prev) =>
                    moveBlock(
                      prev,
                      block.id,
                      target.location,
                      getChildrenAt(prev, target.location).length,
                    ),
                  )
                }
              >
                {target.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ActionButton
        label="Duplicar (Ctrl+D)"
        onClick={() => {
          const { tree, newId } = duplicateBlock(blocks, block.id);
          setBlocks(tree);
          if (newId) onSelect(newId);
        }}
      >
        <Copy className="h-3.5 w-3.5" />
      </ActionButton>
      <ActionButton label="Editar propriedades" onClick={() => onEdit(block.id)}>
        <Pencil className="h-3.5 w-3.5" />
      </ActionButton>
      <ActionButton
        label="Excluir (Delete)"
        destructive
        onClick={() => {
          setBlocks((prev) => removeBlockAnywhere(prev, block.id));
          if (selectedId === block.id) onSelect(null);
        }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </ActionButton>
    </div>
  );
}

/** "+ Adicionar" menu listing every element type accepted by a list. */
export function AddBlockMenu({
  location,
  label = 'Adicionar',
  className,
}: {
  location: BlockLocation;
  label?: string;
  className?: string;
}) {
  const { blocks, setBlocks, onSelect, onEdit } = useCanvas();
  const types = PALETTE_ITEMS.filter((item) => canDropAt(item.type, location));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'text-muted-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/5 flex cursor-pointer items-center justify-center gap-1 rounded-md border border-dashed px-2 py-1 text-xs font-medium transition-colors',
            className,
          )}
        >
          <Plus className="h-3.5 w-3.5" /> {label}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {types.map(({ type, icon: Icon }) => (
          <DropdownMenuItem
            key={type}
            onSelect={() => {
              const newBlock = createDefaultBlock(type, blocks);
              setBlocks((prev) => insertBlockAt(prev, location, newBlock));
              onSelect(newBlock.id);
              onEdit(newBlock.id);
            }}
          >
            <Icon className="h-4 w-4" /> {BLOCK_TYPE_LABELS[type]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ContainerBody({ block }: { block: ContainerBlock }) {
  const location: BlockLocation = { type: 'container', containerId: block.id };
  const axis = containerAxis(block);
  const { setNodeRef, isDragging, accepts, isTarget } = useListDroppable(location, axis);
  const { props } = block;
  const isFlex = props.display === 'flex';

  // Editor spacing has a floor so the element tabs never overlap; the exact
  // spacing is visible in the Preview.
  const gap = `max(${props.gap ?? 0}${props.gapUnit ?? 'px'}, 18px)`;
  const style: CSSProperties = {
    backgroundColor: resolveThemeColor(props.backgroundColor),
    padding: `${Math.max(props.paddingY, 14)}px ${Math.max(props.paddingX, 8)}px ${Math.max(props.paddingY, 8)}px`,
    ...(isFlex
      ? {
          display: 'flex',
          flexDirection: props.flexDirection ?? 'row',
          flexWrap: props.flexWrap ?? 'nowrap',
          justifyContent: props.justifyContent ?? 'flex-start',
          alignItems: props.alignItems ?? 'stretch',
          gap,
        }
      : { display: 'flex', flexDirection: 'column', gap: '18px' }),
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          'relative rounded-md outline-1 outline-offset-0 transition-[outline-color,background-color]',
          isTarget
            ? 'outline-sky-500 outline-solid'
            : isDragging && accepts
              ? 'outline-violet-500/60 outline-dashed'
              : 'outline-transparent',
          isDragging && !accepts && 'opacity-60',
        )}
      >
        <CanvasItems
          location={location}
          items={block.children}
          axis={axis}
          emptyLabel="Solte elementos aqui"
        />
      </div>
      <AddBlockMenu location={location} className="self-start" />
    </div>
  );
}

function RowBody({ block }: { block: RowBlock }) {
  const { setBlocks } = useCanvas();
  return (
    <div
      className="flex flex-col gap-2 rounded-md"
      style={{
        backgroundColor: resolveThemeColor(block.props.backgroundColor),
        padding: `${Math.min(block.props.paddingY, 16)}px ${block.props.paddingX}px`,
      }}
    >
      <div className="flex gap-2">
        {block.children.map((column, i) => (
          <RowColumn
            key={column.id}
            row={block}
            columnIndex={i}
            canRemove={block.children.length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        disabled={block.children.length >= 6}
        onClick={(e) => {
          e.stopPropagation();
          setBlocks((prev) => addColumnToRow(prev, block.id));
        }}
        className="text-muted-foreground hover:text-primary flex cursor-pointer items-center gap-1 self-start rounded px-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-3.5 w-3.5" /> Coluna
      </button>
    </div>
  );
}

function RowColumn({
  row,
  columnIndex,
  canRemove,
}: {
  row: RowBlock;
  columnIndex: number;
  canRemove: boolean;
}) {
  const { setBlocks } = useCanvas();
  const column = row.children[columnIndex];
  const location: BlockLocation = { type: 'column', rowId: row.id, columnId: column.id };
  const { setNodeRef, isDragging, accepts, isTarget } = useListDroppable(location);

  return (
    <div
      style={{ width: `${column.props.widthPercent}%` }}
      className="flex min-w-0 flex-col gap-1.5"
    >
      <div className="text-muted-foreground flex items-center justify-between gap-1 px-0.5 text-[10px] font-medium">
        <span className="truncate">
          Coluna {columnIndex + 1} · {column.props.widthPercent}%
        </span>
        {canRemove && (
          <button
            type="button"
            title="Remover coluna"
            aria-label="Remover coluna"
            onClick={(e) => {
              e.stopPropagation();
              setBlocks((prev) => removeColumnFromRow(prev, row.id, column.id));
            }}
            className="hover:text-destructive cursor-pointer rounded p-0.5"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-16 flex-1 flex-col gap-[18px] rounded-md border border-dashed p-2 pt-3.5 transition-colors',
          isTarget
            ? 'border-sky-500 bg-sky-500/5'
            : isDragging && accepts
              ? 'border-amber-500/70 bg-amber-500/5'
              : 'border-amber-500/40',
          isDragging && !accepts && 'opacity-60',
        )}
      >
        <CanvasItems location={location} items={column.children} emptyLabel="Solte aqui" />
      </div>
      <AddBlockMenu location={location} className="w-full" />
    </div>
  );
}
