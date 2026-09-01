'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  addBlockToColumn,
  addBlockToContainer,
  createDefaultBlock,
  insertTopLevelBlock,
  moveTopLevelBlock,
  removeTopLevelBlock,
} from '@/lib/notification-templates/block-tree-utils';
import type {
  BlockTree,
  BlockType,
  ColumnChildBlock,
} from '@/lib/notification-templates/block-types';
import { VARIABLE_CATALOG } from '@/lib/notification-templates/variable-catalog';
import { renderBlockTreeToHtml } from '@/lib/notification-templates/render';
import {
  createNotificationTemplate,
  updateNotificationTemplate,
} from '@/lib/actions/notification-templates';
import type { NotificationTemplateDTO } from '@/lib/queries/notification-templates';
import { showError, showSuccess } from '@/lib/utils/toast';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { BlockPalette, BlockTypeCard } from './block-palette';
import { BlockPropertiesDialog } from './block-properties-dialog';
import { Canvas } from './canvas';
import { PreviewPanel } from './preview-panel';
import { Toolbar } from './toolbar';
import { VariablePicker } from './variable-picker';

interface TemplateBuilderProps {
  template: NotificationTemplateDTO | null;
}

export function TemplateBuilder({ template }: TemplateBuilderProps) {
  const router = useRouter();

  const [name, setName] = useState(template?.name ?? '');
  const [type, setType] = useState<NotificationType>(
    (template?.type as NotificationType) ?? NotificationType.SYSTEM,
  );
  const [channel, setChannel] = useState<NotificationChannel>(
    (template?.channel as NotificationChannel) ?? NotificationChannel.EMAIL,
  );
  const [subject, setSubject] = useState(template?.subject ?? '');
  const [blocks, setBlocks] = useState<BlockTree>(template?.content ?? []);
  const [bodyWhatsapp, setBodyWhatsapp] = useState(template?.bodyWhatsapp ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeDragBlockType, setActiveDragBlockType] = useState<BlockType | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const previewHtml = useMemo(() => renderBlockTreeToHtml(blocks), [blocks]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as
      { source: 'palette'; blockType: BlockType } | { source: 'block' } | undefined;
    setActiveDragBlockType(data?.source === 'palette' ? data.blockType : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragBlockType(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as
      { source: 'palette'; blockType: BlockType } | { source: 'block' } | undefined;
    const overId = String(over.id);

    if (activeData?.source === 'palette') {
      const newBlock = createDefaultBlock(activeData.blockType, blocks);
      // Row/Container are container-only blocks (max nesting depth = 2) — they
      // can never be dropped inside a column or another container, only at
      // the top level.
      const canNestInsideContainer = newBlock.type !== 'row' && newBlock.type !== 'container';

      if (canNestInsideContainer && overId.startsWith('column:')) {
        const [, rowId, columnId] = overId.split(':');
        setBlocks((prev) => addBlockToColumn(prev, rowId, columnId, newBlock as ColumnChildBlock));
      } else if (canNestInsideContainer && overId.startsWith('container:')) {
        const containerId = overId.slice('container:'.length);
        setBlocks((prev) => addBlockToContainer(prev, containerId, newBlock as ColumnChildBlock));
      } else {
        setBlocks((prev) => {
          if (overId === 'canvas-top-level') return insertTopLevelBlock(prev, newBlock);
          const idx = prev.findIndex((b) => b.id === overId);
          return insertTopLevelBlock(prev, newBlock, idx === -1 ? prev.length : idx);
        });
      }
      setSelectedId(newBlock.id);
      return;
    }

    if (activeData?.source === 'block') {
      const activeId = String(active.id);
      if (activeId === overId) return;

      // Only top-level blocks are draggable today, so the dragged block is
      // always found at the top level here.
      const draggedBlock = blocks.find((b) => b.id === activeId);
      if (!draggedBlock) return;

      // Row/Container can't nest inside a column or another container.
      const canNestInsideContainer =
        draggedBlock.type !== 'row' && draggedBlock.type !== 'container';

      if (canNestInsideContainer && overId.startsWith('column:')) {
        const [, rowId, columnId] = overId.split(':');
        setBlocks((prev) => {
          const without = removeTopLevelBlock(prev, activeId);
          return addBlockToColumn(without, rowId, columnId, draggedBlock as ColumnChildBlock);
        });
        return;
      }

      if (canNestInsideContainer && overId.startsWith('container:')) {
        const containerId = overId.slice('container:'.length);
        setBlocks((prev) => {
          const without = removeTopLevelBlock(prev, activeId);
          return addBlockToContainer(without, containerId, draggedBlock as ColumnChildBlock);
        });
        return;
      }

      setBlocks((prev) => {
        const fromIndex = prev.findIndex((b) => b.id === activeId);
        const toIndex = prev.findIndex((b) => b.id === overId);
        if (fromIndex === -1 || toIndex === -1) return prev;
        return moveTopLevelBlock(prev, fromIndex, toIndex);
      });
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showError('Informe um nome para o template');
      return;
    }
    if (channel === NotificationChannel.EMAIL && !subject.trim()) {
      showError('Informe o assunto do e-mail');
      return;
    }
    if (channel === NotificationChannel.WHATSAPP && !bodyWhatsapp.trim()) {
      showError('Informe a mensagem do WhatsApp');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        channel,
        subject: channel === NotificationChannel.EMAIL ? subject : '',
        bodyHtml: channel === NotificationChannel.EMAIL ? renderBlockTreeToHtml(blocks) : '',
        bodyWhatsapp: channel === NotificationChannel.WHATSAPP ? bodyWhatsapp : '',
        content: channel === NotificationChannel.EMAIL ? blocks : null,
        isActive: template?.isActive ?? true,
      };

      const result = template
        ? await updateNotificationTemplate(template.id, payload)
        : await createNotificationTemplate(payload);

      if (result.success) {
        showSuccess(template ? 'Template atualizado com sucesso' : 'Template criado com sucesso');
        router.push('/notification-templates');
        router.refresh();
      } else {
        showError(result.error || 'Erro ao salvar template');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Toolbar
        name={name}
        onNameChange={setName}
        type={type}
        onTypeChange={setType}
        channel={channel}
        onChannelChange={setChannel}
        onPreview={() => setIsPreviewOpen(true)}
        onCancel={() => router.push('/notification-templates')}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {channel === NotificationChannel.EMAIL ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Assunto do e-mail</Label>
            <div className="flex max-w-xl gap-2">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Assunto do e-mail"
              />
              <VariablePicker onInsert={(key) => setSubject((prev) => `${prev}{{${key}}}`)} />
            </div>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveDragBlockType(null)}
          >
            <div className="grid grid-cols-[200px_1fr] items-start gap-4">
              <BlockPalette />
              <Canvas
                blocks={blocks}
                setBlocks={setBlocks}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
            <DragOverlay>
              {activeDragBlockType && (
                <BlockTypeCard type={activeDragBlockType} className="shadow-lg" />
              )}
            </DragOverlay>
          </DndContext>

          {selectedId && (
            <BlockPropertiesDialog
              key={selectedId}
              blocks={blocks}
              setBlocks={setBlocks}
              selectedId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          )}

          <PreviewPanel
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
            html={previewHtml}
          />
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-medium">Mensagem do WhatsApp</Label>
          <RichTextEditor
            value={bodyWhatsapp}
            onChange={setBodyWhatsapp}
            variableGroups={VARIABLE_CATALOG}
          />
        </div>
      )}
    </div>
  );
}
