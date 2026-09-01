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

export function removeTopLevelBlock(blocks: BlockTree, id: string): BlockTree {
  return blocks.filter((block) => block.id !== id);
}

export function moveTopLevelBlock(
  blocks: BlockTree,
  fromIndex: number,
  toIndex: number,
): BlockTree {
  const next = [...blocks];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function insertTopLevelBlock(blocks: BlockTree, block: Block, index?: number): BlockTree {
  const next = [...blocks];
  next.splice(index ?? next.length, 0, block);
  return next;
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

export function addBlockToColumn(
  blocks: BlockTree,
  rowId: string,
  columnId: string,
  child: ColumnChildBlock,
): BlockTree {
  return updateRowColumns(blocks, rowId, (columns) =>
    columns.map((col) =>
      col.id === columnId ? { ...col, children: [...col.children, child] } : col,
    ),
  );
}

export function removeBlockFromColumn(
  blocks: BlockTree,
  rowId: string,
  columnId: string,
  childId: string,
): BlockTree {
  return updateRowColumns(blocks, rowId, (columns) =>
    columns.map((col) =>
      col.id === columnId
        ? { ...col, children: col.children.filter((c) => c.id !== childId) }
        : col,
    ),
  );
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

export function moveBlockInColumn(
  blocks: BlockTree,
  rowId: string,
  columnId: string,
  fromIndex: number,
  toIndex: number,
): BlockTree {
  return updateRowColumns(blocks, rowId, (columns) =>
    columns.map((col) => {
      if (col.id !== columnId) return col;
      const next = [...col.children];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { ...col, children: next };
    }),
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

export function addBlockToContainer(
  blocks: BlockTree,
  containerId: string,
  child: ColumnChildBlock,
): BlockTree {
  return updateContainerChildren(blocks, containerId, (children) => [...children, child]);
}

export function removeBlockFromContainer(
  blocks: BlockTree,
  containerId: string,
  childId: string,
): BlockTree {
  return updateContainerChildren(blocks, containerId, (children) =>
    children.filter((c) => c.id !== childId),
  );
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

export function moveBlockInContainer(
  blocks: BlockTree,
  containerId: string,
  fromIndex: number,
  toIndex: number,
): BlockTree {
  return updateContainerChildren(blocks, containerId, (children) => {
    const next = [...children];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  });
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
