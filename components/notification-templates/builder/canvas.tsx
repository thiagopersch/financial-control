'use client';

import { Button } from '@/components/ui/button';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TOP_LEVEL_LOCATION } from '@/lib/notification-templates/block-tree-utils';
import type { BlockTree } from '@/lib/notification-templates/block-types';
import { cn } from '@/lib/utils';
import { useTemplateBuilderPrefs } from '@/hooks/use-template-builder-prefs';
import { LayoutTemplate, Redo2, Undo2 } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { AddBlockMenu, CanvasItems, CanvasProvider, useListDroppable } from './canvas-tree';
import type { DragData, DropTarget } from './use-builder-dnd';

const SHORTCUTS_HELP =
  'Arraste pela etiqueta do elemento para movê-lo — inclusive para dentro ou para fora de contêineres e colunas. ' +
  'Atalhos com um elemento selecionado: Delete exclui, Ctrl+D duplica, Alt+↑/↓ move, Esc limpa a seleção. ' +
  'Ctrl+Z desfaz e Ctrl+Shift+Z refaz.';

interface CanvasProps {
  blocks: BlockTree;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (id: string) => void;
  activeDrag: DragData | null;
  dropTarget: DropTarget | null;
  history: { undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean };
}

export function Canvas({
  blocks,
  setBlocks,
  selectedId,
  onSelect,
  onEdit,
  activeDrag,
  dropTarget,
  history,
}: CanvasProps) {
  const useAppTheme = useTemplateBuilderPrefs((s) => s.useAppTheme);
  const setUseAppTheme = useTemplateBuilderPrefs((s) => s.setUseAppTheme);

  return (
    <CanvasProvider
      value={{
        blocks,
        setBlocks,
        selectedId,
        onSelect,
        onEdit,
        activeDrag,
        dropTarget,
        useAppTheme,
      }}
    >
      <div className="flex min-w-0 flex-col overflow-hidden rounded-xl border">
        <div className="bg-card flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-2">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-semibold">Montagem</span>
            <span className="text-muted-foreground text-xs">
              {blocks.length} {blocks.length === 1 ? 'elemento' : 'elementos'}
            </span>
            <InfoTooltip text={SHORTCUTS_HELP} />
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Desfazer (Ctrl+Z)"
              aria-label="Desfazer"
              disabled={!history.canUndo}
              onClick={history.undo}
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Refazer (Ctrl+Shift+Z)"
              aria-label="Refazer"
              disabled={!history.canRedo}
              onClick={history.redo}
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Switch
              id="builder-app-theme"
              size="sm"
              checked={useAppTheme}
              onCheckedChange={setUseAppTheme}
            />
            <Label htmlFor="builder-app-theme" className="cursor-pointer text-xs font-medium">
              Visualizar com o tema do app
            </Label>
          </div>
        </div>

        <CanvasSurface useAppTheme={useAppTheme} blocks={blocks} onSelect={onSelect} />
      </div>
    </CanvasProvider>
  );
}

function CanvasSurface({
  useAppTheme,
  blocks,
  onSelect,
}: {
  useAppTheme: boolean;
  blocks: BlockTree;
  onSelect: (id: string | null) => void;
}) {
  const { setNodeRef, isTarget } = useListDroppable(TOP_LEVEL_LOCATION);

  return (
    <div
      ref={setNodeRef}
      onClick={() => onSelect(null)}
      className={cn(
        // Off: always light, like the real e-mail. On: follows the app theme.
        !useAppTheme && 'email-canvas-light',
        'bg-muted/60 text-foreground min-h-[560px] p-4 transition-colors sm:p-8',
        isTarget && blocks.length > 0 && 'bg-sky-500/5',
      )}
    >
      <div
        className={cn(
          'bg-background mx-auto flex max-w-[640px] flex-col gap-[22px] rounded-lg border px-4 pt-7 pb-4 shadow-sm sm:px-6',
        )}
      >
        {blocks.length === 0 ? (
          <div
            className={cn(
              'text-muted-foreground flex min-h-[380px] flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 text-center text-sm transition-colors',
              isTarget && 'border-sky-500 bg-sky-500/5 text-sky-700',
            )}
          >
            <LayoutTemplate className="h-8 w-8 opacity-50" />
            <p className="font-medium">Seu template está vazio</p>
            <p className="max-w-xs text-xs">
              Arraste elementos da paleta para cá ou use o botão abaixo para adicionar.
            </p>
          </div>
        ) : (
          <CanvasItems location={TOP_LEVEL_LOCATION} items={blocks} emptyLabel="" />
        )}
        <AddBlockMenu location={TOP_LEVEL_LOCATION} label="Adicionar elemento" className="py-2" />
      </div>
    </div>
  );
}
