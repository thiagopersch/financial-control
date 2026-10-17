import type { Block, BlockTree, BlockType, ColumnBlock, ColumnChildBlock } from './block-types';

export function generateBlockId(): string {
  return crypto.randomUUID();
}

export function createDefaultColumn(widthPercent: number): ColumnBlock {
  return {
    id: generateBlockId(),
    type: 'column',
    props: { widthPercent },
    children: [],
  };
}

function evenWidths(count: number): number[] {
  const base = Math.floor(100 / count);
  const widths = Array(count).fill(base);
  widths[count - 1] += 100 - base * count;
  return widths;
}

/** Recursively collects every addressable block (top level + row-column and container children). */
function collectAllBlocks(blocks: BlockTree): (Block | ColumnChildBlock)[] {
  const result: (Block | ColumnChildBlock)[] = [];
  for (const block of blocks) {
    result.push(block);
    if (block.type === 'row') {
      for (const column of block.children) result.push(...column.children);
    }
    if (block.type === 'container') {
      result.push(...block.children);
    }
  }
  return result;
}

/** Generates the next free default name for a type, e.g. "text1", "container2". */
export function generateDefaultBlockName(type: BlockType, blocks: BlockTree): string {
  const pattern = new RegExp(`^${type}(\\d+)$`);
  let max = 0;
  for (const block of collectAllBlocks(blocks)) {
    const match = block.name?.match(pattern);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${type}${max + 1}`;
}

export function createDefaultBlock(type: BlockType, existingBlocks: BlockTree): Block {
  const id = generateBlockId();
  const name = generateDefaultBlockName(type, existingBlocks);
  switch (type) {
    case 'text':
      return { id, name, type: 'text', props: { html: '<p>Digite seu texto aqui...</p>' } };
    case 'image':
      return {
        id,
        name,
        type: 'image',
        props: { src: '', alt: '', align: 'center', borderRadius: 0 },
      };
    case 'row': {
      const widths = evenWidths(2);
      return {
        id,
        name,
        type: 'row',
        props: { paddingY: 16, paddingX: 0, backgroundColor: 'transparent' },
        children: widths.map((w) => createDefaultColumn(w)),
      };
    }
    case 'table':
      return {
        id,
        name,
        type: 'table',
        props: {
          rows: 2,
          cols: 2,
          hasHeader: true,
          cells: [
            ['Coluna 1', 'Coluna 2'],
            ['Valor 1', 'Valor 2'],
          ],
        },
      };
    case 'button':
      return {
        id,
        name,
        type: 'button',
        props: {
          label: 'Clique aqui',
          href: '',
          bgColor: '#171717',
          textColor: '#ffffff',
          radius: 6,
          paddingY: 10,
          paddingX: 20,
          align: 'center',
        },
      };
    case 'divider':
      return {
        id,
        name,
        type: 'divider',
        props: { color: '#e2e8f0', thickness: 1, marginY: 16 },
      };
    case 'container':
      return {
        id,
        name,
        type: 'container',
        props: {
          marginY: 0,
          marginX: 0,
          paddingY: 16,
          paddingX: 16,
          backgroundColor: 'transparent',
        },
        children: [],
      };
    case 'data':
      return { id, name, type: 'data', props: { source: 'overdueTransactionsTable' } };
    case 'column':
      throw new Error('Column blocks can only be created inside a row');
  }
}

/** Recomputes evenly-split column widths after adding/removing a column. */
export function redistributeColumnWidths(columns: ColumnBlock[]): ColumnBlock[] {
  const widths = evenWidths(columns.length);
  return columns.map((col, i) => ({ ...col, props: { ...col.props, widthPercent: widths[i] } }));
}

export function updateTopLevelBlock(
  blocks: BlockTree,
  id: string,
  updater: (block: Block) => Block,
): BlockTree {
  return blocks.map((block) => (block.id === id ? updater(block) : block));
}

/** Updates a row's columns (used for column-scoped operations: add/remove/reorder child, resize). */
export function updateRowColumns(
  blocks: BlockTree,
  rowId: string,
  updater: (columns: ColumnBlock[]) => ColumnBlock[],
): BlockTree {
  return blocks.map((block) => {
    if (block.id !== rowId || block.type !== 'row') return block;
    return { ...block, children: updater(block.children) };
  });
}

export function updateBlockInColumn(
  blocks: BlockTree,
  rowId: string,
  columnId: string,
  childId: string,
  updater: (child: ColumnChildBlock) => ColumnChildBlock,
): BlockTree {
  return updateRowColumns(blocks, rowId, (columns) =>
    columns.map((col) =>
      col.id === columnId
        ? { ...col, children: col.children.map((c) => (c.id === childId ? updater(c) : c)) }
        : col,
    ),
  );
}

export function addColumnToRow(blocks: BlockTree, rowId: string): BlockTree {
  return updateRowColumns(blocks, rowId, (columns) => {
    if (columns.length >= 6) return columns;
    return redistributeColumnWidths([...columns, createDefaultColumn(0)]);
  });
}

export function removeColumnFromRow(blocks: BlockTree, rowId: string, columnId: string): BlockTree {
  return updateRowColumns(blocks, rowId, (columns) => {
    if (columns.length <= 1) return columns;
    return redistributeColumnWidths(columns.filter((col) => col.id !== columnId));
  });
}

/** Updates a container's children (used for child-scoped operations: add/remove/reorder/update). */
export function updateContainerChildren(
  blocks: BlockTree,
  containerId: string,
  updater: (children: ColumnChildBlock[]) => ColumnChildBlock[],
): BlockTree {
  return blocks.map((block) => {
    if (block.id !== containerId || block.type !== 'container') return block;
    return { ...block, children: updater(block.children) };
  });
}

export function updateBlockInContainer(
  blocks: BlockTree,
  containerId: string,
  childId: string,
  updater: (child: ColumnChildBlock) => ColumnChildBlock,
): BlockTree {
  return updateContainerChildren(blocks, containerId, (children) =>
    children.map((c) => (c.id === childId ? updater(c) : c)),
  );
}

export type BlockLocation =
  | { type: 'top' }
  | { type: 'column'; rowId: string; columnId: string }
  | { type: 'container'; containerId: string };

/** Locates a block anywhere in the tree (top level or nested inside a row's column). */
export function findBlockAnywhere(
  blocks: BlockTree,
  id: string,
): { block: Block | ColumnChildBlock; location: BlockLocation } | null {
  for (const block of blocks) {
    if (block.id === id) return { block, location: { type: 'top' } };
    if (block.type === 'row') {
      for (const column of block.children) {
        const child = column.children.find((c) => c.id === id);
        if (child)
          return {
            block: child,
            location: { type: 'column', rowId: block.id, columnId: column.id },
          };
      }
    }
    if (block.type === 'container') {
      const child = block.children.find((c) => c.id === id);
      if (child) return { block: child, location: { type: 'container', containerId: block.id } };
    }
  }
  return null;
}

/** Updates a block regardless of whether it lives at the top level or inside a column. */
export function updateBlockAnywhere(
  blocks: BlockTree,
  id: string,
  location: BlockLocation,
  updater: (block: Block | ColumnChildBlock) => Block | ColumnChildBlock,
): BlockTree {
  if (location.type === 'top') {
    return updateTopLevelBlock(blocks, id, updater as (block: Block) => Block);
  }
  if (location.type === 'container') {
    return updateBlockInContainer(
      blocks,
      location.containerId,
      id,
      updater as (child: ColumnChildBlock) => ColumnChildBlock,
    );
  }
  return updateBlockInColumn(
    blocks,
    location.rowId,
    location.columnId,
    id,
    updater as (child: ColumnChildBlock) => ColumnChildBlock,
  );
}

export const TOP_LEVEL_LOCATION: BlockLocation = { type: 'top' };

/** Stable string id for a list location — used as droppable id in the builder canvas. */
export function locationKey(location: BlockLocation): string {
  if (location.type === 'top') return 'top';
  if (location.type === 'container') return `container:${location.containerId}`;
  return `column:${location.rowId}:${location.columnId}`;
}

export function isSameLocation(a: BlockLocation, b: BlockLocation): boolean {
  return locationKey(a) === locationKey(b);
}

/** Row/Container can only live at the top level (max nesting depth = 2). */
export function canDropAt(blockType: BlockType, location: BlockLocation): boolean {
  if (location.type === 'top') return blockType !== 'column';
  return blockType !== 'row' && blockType !== 'container' && blockType !== 'column';
}

/** Returns the block list living at a location (empty when the location no longer exists). */
export function getChildrenAt(
  blocks: BlockTree,
  location: BlockLocation,
): (Block | ColumnChildBlock)[] {
  if (location.type === 'top') return blocks;
  if (location.type === 'container') {
    const container = blocks.find((b) => b.id === location.containerId);
    return container?.type === 'container' ? container.children : [];
  }
  const row = blocks.find((b) => b.id === location.rowId);
  if (row?.type !== 'row') return [];
  return row.children.find((col) => col.id === location.columnId)?.children ?? [];
}

function updateListAt(
  blocks: BlockTree,
  location: BlockLocation,
  updater: (list: (Block | ColumnChildBlock)[]) => (Block | ColumnChildBlock)[],
): BlockTree {
  if (location.type === 'top') return updater(blocks) as BlockTree;
  if (location.type === 'container') {
    return updateContainerChildren(
      blocks,
      location.containerId,
      (children) => updater(children) as ColumnChildBlock[],
    );
  }
  return updateRowColumns(blocks, location.rowId, (columns) =>
    columns.map((col) =>
      col.id === location.columnId
        ? { ...col, children: updater(col.children) as ColumnChildBlock[] }
        : col,
    ),
  );
}

/** Inserts a block at `index` of a location's list (clamped; appends when omitted). No-op when the drop is invalid. */
export function insertBlockAt(
  blocks: BlockTree,
  location: BlockLocation,
  block: Block | ColumnChildBlock,
  index?: number,
): BlockTree {
  if (!canDropAt(block.type, location)) return blocks;
  return updateListAt(blocks, location, (list) => {
    const next = [...list];
    const at = Math.max(0, Math.min(index ?? next.length, next.length));
    next.splice(at, 0, block);
    return next;
  });
}

/** Removes a block from wherever it lives in the tree. */
export function removeBlockAnywhere(blocks: BlockTree, id: string): BlockTree {
  const found = findBlockAnywhere(blocks, id);
  if (!found) return blocks;
  return updateListAt(blocks, found.location, (list) => list.filter((b) => b.id !== id));
}

/**
 * Moves a block to `targetIndex` of `target` — the index is "insert before the
 * item currently at this position" in the target list as rendered before the
 * move (so dropping right after yourself is a no-op). Invalid drops (row or
 * container into a nested list) leave the tree untouched.
 */
export function moveBlock(
  blocks: BlockTree,
  id: string,
  target: BlockLocation,
  targetIndex: number,
): BlockTree {
  const found = findBlockAnywhere(blocks, id);
  if (!found || !canDropAt(found.block.type, target)) return blocks;

  let index = targetIndex;
  if (isSameLocation(found.location, target)) {
    const fromIndex = getChildrenAt(blocks, target).findIndex((b) => b.id === id);
    if (fromIndex < index) index -= 1;
    if (fromIndex === index) return blocks;
  }
  return insertBlockAt(removeBlockAnywhere(blocks, id), target, found.block, index);
}

/** Moves a block one position up (-1) or down (+1) inside its own list. */
export function moveBlockByOffset(blocks: BlockTree, id: string, offset: -1 | 1): BlockTree {
  const found = findBlockAnywhere(blocks, id);
  if (!found) return blocks;
  const list = getChildrenAt(blocks, found.location);
  const index = list.findIndex((b) => b.id === id);
  const nextIndex = index + offset;
  if (nextIndex < 0 || nextIndex >= list.length) return blocks;
  return moveBlock(blocks, id, found.location, offset === 1 ? nextIndex + 1 : nextIndex);
}

function cloneWithNewIds<T extends Block | ColumnChildBlock | ColumnBlock>(block: T): T {
  const copy = structuredClone(block);
  copy.id = generateBlockId();
  if ('children' in copy) {
    (copy as { children: (ColumnBlock | ColumnChildBlock)[] }).children = copy.children.map(
      (child) => cloneWithNewIds(child),
    );
  }
  return copy;
}

/** Duplicates a block (with fresh ids for it and its descendants) right below the original. */
export function duplicateBlock(
  blocks: BlockTree,
  id: string,
): { tree: BlockTree; newId: string | null } {
  const found = findBlockAnywhere(blocks, id);
  if (!found) return { tree: blocks, newId: null };
  const copy = cloneWithNewIds(found.block);
  copy.name = generateDefaultBlockName(copy.type, blocks);
  const index = getChildrenAt(blocks, found.location).findIndex((b) => b.id === id);
  return { tree: insertBlockAt(blocks, found.location, copy, index + 1), newId: copy.id };
}

export interface DropTarget {
  location: BlockLocation;
  label: string;
}

/** Every list a block of `blockType` may be moved into — feeds the "Mover para…" menu. */
export function listDropTargets(blocks: BlockTree, blockType: BlockType): DropTarget[] {
  const targets: DropTarget[] = [{ location: TOP_LEVEL_LOCATION, label: 'Nível principal' }];
  for (const block of blocks) {
    if (block.type === 'container') {
      targets.push({
        location: { type: 'container', containerId: block.id },
        label: block.name || 'Contêiner',
      });
    }
    if (block.type === 'row') {
      block.children.forEach((column, i) =>
        targets.push({
          location: { type: 'column', rowId: block.id, columnId: column.id },
          label: `${block.name || 'Linha'} · Coluna ${i + 1}`,
        }),
      );
    }
  }
  return targets.filter((t) => canDropAt(blockType, t.location));
}
