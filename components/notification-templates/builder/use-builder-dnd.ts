'use client';

import {
  closestCenter,
  KeyboardSensor,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
  type ClientRect,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type Over,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  canDropAt,
  createDefaultBlock,
  getChildrenAt,
  insertBlockAt,
  isSameLocation,
  locationKey,
  moveBlock,
  type BlockLocation,
} from '@/lib/notification-templates/block-tree-utils';
import type { BlockTree, BlockType } from '@/lib/notification-templates/block-types';
import { useCallback, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';

type Coordinates = { x: number; y: number };

/** Payload of anything that can be dragged: a palette item or an existing block. */
export type DragData =
  | { kind: 'palette'; blockType: BlockType }
  | { kind: 'block'; blockType: BlockType; blockId: string; name: string };

/** Layout of a list, so the drop indicator knows whether "before" means above or to the left. */
export interface ListAxis {
  axis: 'x' | 'y';
  reverse: boolean;
}

/** Payload of drop zones: a whole list (canvas, column, container) or a single block inside one. */
export type DropData =
  | ({ kind: 'list'; location: BlockLocation } & ListAxis)
  | ({ kind: 'block'; blockId: string; location: BlockLocation } & ListAxis);

/** Where the dragged item will land: "insert before the item at `index`" of `location`'s list. */
export interface DropTarget {
  location: BlockLocation;
  index: number;
}

export const listDroppableId = (location: BlockLocation) => `list:${locationKey(location)}`;
export const blockDroppableId = (blockId: string) => `block:${blockId}`;

function rectArea(rect: ClientRect | undefined) {
  return rect ? rect.width * rect.height : Number.POSITIVE_INFINITY;
}

function isBefore(rect: ClientRect, pointer: Coordinates, { axis, reverse }: ListAxis) {
  const before =
    axis === 'x' ? pointer.x < rect.left + rect.width / 2 : pointer.y < rect.top + rect.height / 2;
  return reverse ? !before : before;
}

interface UseBuilderDndOptions {
  blocks: BlockTree;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
  /** Called with the id of a block created from the palette (to select it). */
  onCreated: (id: string) => void;
}

export function useBuilderDnd({ blocks, setBlocks, onCreated }: UseBuilderDndOptions) {
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const pointerRef = useRef<Coordinates | null>(null);
  const rectsRef = useRef<Map<UniqueIdentifier, ClientRect>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );

  /**
   * Only zones that accept the dragged type are candidates (a Row/Container
   * never targets a nested list); among the ones under the pointer the
   * innermost (smallest) wins, so a child inside a container beats the
   * container itself, which beats the canvas.
   */
  const collisionDetection: CollisionDetection = useCallback((args) => {
    pointerRef.current = args.pointerCoordinates;
    rectsRef.current = args.droppableRects;
    const drag = args.active.data.current as DragData | undefined;
    const valid = args.droppableContainers.filter((container) => {
      const data = container.data.current as DropData | undefined;
      return !!drag && !!data && canDropAt(drag.blockType, data.location);
    });
    const hits = pointerWithin({ ...args, droppableContainers: valid });
    if (hits.length) {
      return [...hits].sort(
        (a, b) => rectArea(args.droppableRects.get(a.id)) - rectArea(args.droppableRects.get(b.id)),
      );
    }
    return closestCenter({ ...args, droppableContainers: valid });
  }, []);

  const resolveTarget = useCallback(
    (over: Over | null, fallbackPointer: Coordinates | null): DropTarget | null => {
      const data = over?.data.current as DropData | undefined;
      const pointer = pointerRef.current ?? fallbackPointer;
      if (!over || !data || !pointer) return null;

      const list = getChildrenAt(blocks, data.location);
      if (data.kind === 'block') {
        const index = list.findIndex((b) => b.id === data.blockId);
        if (index === -1) return null;
        return {
          location: data.location,
          index: isBefore(over.rect, pointer, data) ? index : index + 1,
        };
      }

      const index = list.findIndex((b) => {
        const rect = rectsRef.current.get(blockDroppableId(b.id));
        return rect ? isBefore(rect, pointer, data) : false;
      });
      return { location: data.location, index: index === -1 ? list.length : index };
    },
    [blocks],
  );

  const translatedCenter = (event: DragMoveEvent | DragEndEvent): Coordinates | null => {
    const rect = event.active.rect.current.translated;
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
  };

  const reset = () => {
    setActiveDrag(null);
    setDropTarget(null);
    pointerRef.current = null;
  };

  const onDragStart = (event: DragStartEvent) => {
    setActiveDrag((event.active.data.current as DragData | undefined) ?? null);
  };

  const onDragMove = (event: DragMoveEvent) => {
    const next = resolveTarget(event.over, translatedCenter(event));
    setDropTarget((prev) => {
      if (prev === next) return prev;
      if (
        prev &&
        next &&
        prev.index === next.index &&
        isSameLocation(prev.location, next.location)
      ) {
        return prev;
      }
      return next;
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    const drag = event.active.data.current as DragData | undefined;
    const target = resolveTarget(event.over, translatedCenter(event));
    reset();
    if (!drag || !target) return;

    if (drag.kind === 'palette') {
      const newBlock = createDefaultBlock(drag.blockType, blocks);
      setBlocks((prev) => insertBlockAt(prev, target.location, newBlock, target.index));
      onCreated(newBlock.id);
      return;
    }
    setBlocks((prev) => moveBlock(prev, drag.blockId, target.location, target.index));
  };

  const dndContextProps = useMemo(
    () => ({ sensors, collisionDetection }),
    [sensors, collisionDetection],
  );

  return {
    dndContextProps,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel: reset,
    activeDrag,
    dropTarget,
  };
}
