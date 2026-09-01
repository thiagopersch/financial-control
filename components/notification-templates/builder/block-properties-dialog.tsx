'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BLOCK_TYPE_LABELS,
  type Block,
  type BlockTree,
  type ColumnChildBlock,
} from '@/lib/notification-templates/block-types';
import {
  findBlockAnywhere,
  updateBlockAnywhere,
} from '@/lib/notification-templates/block-tree-utils';
import {
  renderBlockTreeToHtml,
  wrapEmailPreviewDocument,
} from '@/lib/notification-templates/render';
import type { Dispatch, SetStateAction } from 'react';
import { useMemo, useState } from 'react';
import { ColumnChildRenderer } from './block-renderer';
import { InspectorPanel } from './inspector-panel';

interface BlockPropertiesDialogProps {
  blocks: BlockTree;
  setBlocks: Dispatch<SetStateAction<BlockTree>>;
  selectedId: string;
  onClose: () => void;
}

export function BlockPropertiesDialog({
  blocks,
  setBlocks,
  selectedId,
  onClose,
}: BlockPropertiesDialogProps) {
  const found = findBlockAnywhere(blocks, selectedId);
  const [draft, setDraft] = useState<Block | ColumnChildBlock | null>(found?.block ?? null);
  const previewDocument = useMemo(
    () => (draft ? wrapEmailPreviewDocument(renderBlockTreeToHtml([draft])) : ''),
    [draft],
  );

  if (!found || !draft) return null;

  const { location } = found;

  const handleConfirm = () => {
    setBlocks((prev) => updateBlockAnywhere(prev, selectedId, location, () => draft));
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {draft.name || BLOCK_TYPE_LABELS[draft.type]}</DialogTitle>
        </DialogHeader>
        <DialogBody className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Nome do elemento</Label>
              <Input
                value={draft.name ?? ''}
                onChange={(e) =>
                  setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))
                }
                placeholder={BLOCK_TYPE_LABELS[draft.type]}
              />
            </div>
            {draft.type !== 'row' && draft.type !== 'container' && draft.type !== 'button' && (
              <ColumnChildRenderer block={draft} isSelected onChange={(next) => setDraft(next)} />
            )}
            <InspectorPanel
              block={draft}
              onChange={(updater) => setDraft((prev) => (prev ? updater(prev) : prev))}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Preview
            </p>
            <p className="text-muted-foreground text-xs">
              Assim ficará no e-mail — o fundo do conteúdo é sempre claro, independente do tema do
              app.
            </p>
            <iframe
              title="Preview do elemento"
              srcDoc={previewDocument}
              className="h-[420px] w-full rounded-md border bg-white"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
