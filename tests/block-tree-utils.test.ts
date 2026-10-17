import type { BlockTree, ContainerBlock, RowBlock } from '@/lib/notification-templates/block-types';
import {
  createDefaultBlock,
  duplicateBlock,
  findBlockAnywhere,
  getChildrenAt,
  insertBlockAt,
  listDropTargets,
  moveBlock,
  moveBlockByOffset,
  TOP_LEVEL_LOCATION,
} from '@/lib/notification-templates/block-tree-utils';
import { describe, expect, it } from 'vitest';

function buildTree() {
  let tree: BlockTree = [];
  const text = createDefaultBlock('text', tree);
  tree = insertBlockAt(tree, TOP_LEVEL_LOCATION, text);
  const containerA = createDefaultBlock('container', tree) as ContainerBlock;
  tree = insertBlockAt(tree, TOP_LEVEL_LOCATION, containerA);
  const containerB = createDefaultBlock('container', tree) as ContainerBlock;
  tree = insertBlockAt(tree, TOP_LEVEL_LOCATION, containerB);
  const row = createDefaultBlock('row', tree) as RowBlock;
  tree = insertBlockAt(tree, TOP_LEVEL_LOCATION, row);
  const button = createDefaultBlock('button', tree);
  const locA = { type: 'container', containerId: containerA.id } as const;
  tree = insertBlockAt(tree, locA, button);
  const image = createDefaultBlock('image', tree);
  tree = insertBlockAt(tree, locA, image);
  const col1 = { type: 'column', rowId: row.id, columnId: row.children[0].id } as const;
  const col2 = { type: 'column', rowId: row.id, columnId: row.children[1].id } as const;
  const divider = createDefaultBlock('divider', tree);
  tree = insertBlockAt(tree, col1, divider);
  return {
    tree,
    ids: { text: text.id, button: button.id, image: image.id, divider: divider.id },
    locA,
    locB: { type: 'container', containerId: containerB.id } as const,
    col1,
    col2,
    containerB,
  };
}

const ids = (list: { id: string }[]) => list.map((b) => b.id);

describe('block-tree-utils: mover blocos', () => {
  it('move do nível principal para dentro de um contêiner na posição indicada', () => {
    const { tree, ids: i, locA } = buildTree();
    const next = moveBlock(tree, i.text, locA, 1);
    expect(ids(getChildrenAt(next, locA))).toEqual([i.button, i.text, i.image]);
    expect(findBlockAnywhere(next, i.text)?.location).toEqual(locA);
  });

  it('move de dentro do contêiner para fora (nível principal)', () => {
    const { tree, ids: i, locA } = buildTree();
    const next = moveBlock(tree, i.image, TOP_LEVEL_LOCATION, 0);
    expect(next[0].id).toBe(i.image);
    expect(ids(getChildrenAt(next, locA))).toEqual([i.button]);
  });

  it('move entre contêineres e entre colunas', () => {
    const { tree, ids: i, locB, col1, col2 } = buildTree();
    const a = moveBlock(tree, i.button, locB, 0);
    expect(ids(getChildrenAt(a, locB))).toEqual([i.button]);
    const b = moveBlock(a, i.divider, col2, 0);
    expect(getChildrenAt(b, col1)).toHaveLength(0);
    expect(ids(getChildrenAt(b, col2))).toEqual([i.divider]);
  });

  it('reordena na mesma lista considerando o índice "inserir antes"', () => {
    const { tree, ids: i, locA } = buildTree();
    expect(ids(getChildrenAt(moveBlock(tree, i.button, locA, 2), locA))).toEqual([
      i.image,
      i.button,
    ]);
    expect(moveBlock(tree, i.button, locA, 1)).toBe(tree);
    expect(ids(getChildrenAt(moveBlockByOffset(tree, i.image, -1), locA))).toEqual([
      i.image,
      i.button,
    ]);
    expect(moveBlockByOffset(tree, i.button, -1)).toBe(tree);
  });

  it('não permite contêiner/linha aninhados', () => {
    const { tree, locA, containerB } = buildTree();
    expect(moveBlock(tree, containerB.id, locA, 0)).toBe(tree);
    expect(listDropTargets(tree, 'container').map((t) => t.location.type)).toEqual(['top']);
  });

  it('duplica com ids novos (inclusive filhos) logo abaixo do original', () => {
    const { tree, locA } = buildTree();
    const containerA = tree[1] as ContainerBlock;
    const { tree: next, newId } = duplicateBlock(tree, containerA.id);
    const copy = next[2] as ContainerBlock;
    expect(copy.id).toBe(newId);
    expect(copy.id).not.toBe(containerA.id);
    expect(copy.children).toHaveLength(2);
    expect(copy.children[0].id).not.toBe(getChildrenAt(tree, locA)[0].id);
    expect(copy.name).not.toBe(containerA.name);
  });
});
