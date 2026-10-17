'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import {
  canDropAt,
  createDefaultBlock,
  duplicateBlock,
  findBlockAnywhere,
  getChildrenAt,
  insertBlockAt,
  moveBlockByOffset,
  removeBlockAnywhere,
  TOP_LEVEL_LOCATION,
  type BlockLocation,
} from '@/lib/notification-templates/block-tree-utils';
import type { BlockType } from '@/lib/notification-templates/block-types';
import { VARIABLE_CATALOG } from '@/lib/notification-templates/variable-catalog';
import {
  renderBlockTreePreviewHtml,
  renderBlockTreeToHtml,
} from '@/lib/notification-templates/render';
import {
  createNotificationTemplate,
  updateNotificationTemplate,
} from '@/lib/actions/notification-templates';
import type { NotificationTemplateDTO } from '@/lib/queries/notification-templates';
import { showError, showSuccess } from '@/lib/utils/toast';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BlockPalette, BlockTypeCard } from './block-palette';
import { Button } from '@/components/ui/button';
import { DEFAULT_REPORT_TEMPLATES } from '@/lib/notification-templates/default-report-templates';
import { BlockPropertiesDialog } from './block-properties-dialog';
import { Canvas } from './canvas';
import { PreviewPanel } from './preview-panel';
import { Toolbar } from './toolbar';
import { useBlockHistory } from './use-block-history';
import { useBuilderDnd } from './use-builder-dnd';
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
  const { blocks, setBlocks, undo, redo, canUndo, canRedo } = useBlockHistory(
    template?.content ?? [],
  );
  const [bodyWhatsapp, setBodyWhatsapp] = useState(template?.bodyWhatsapp ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectAndEdit = (id: string) => {
    setSelectedId(id);
    setEditingId(id);
  };

  const dnd = useBuilderDnd({ blocks, setBlocks, onCreated: selectAndEdit });

  const previewHtml = useMemo(() => renderBlockTreePreviewHtml(blocks), [blocks]);

  /** Palette click: add next to the selected element (inside it, when it's a container). */
  const handlePaletteAdd = (type: BlockType) => {
    const newBlock = createDefaultBlock(type, blocks);
    const selected = selectedId ? findBlockAnywhere(blocks, selectedId) : null;
    let location: BlockLocation = TOP_LEVEL_LOCATION;
    let index: number | undefined;

    if (selected) {
      const containerLocation: BlockLocation = {
        type: 'container',
        containerId: selected.block.id,
      };
      if (selected.block.type === 'container' && canDropAt(type, containerLocation)) {
        location = containerLocation;
      } else if (canDropAt(type, selected.location)) {
        location = selected.location;
        index = getChildrenAt(blocks, location).findIndex((b) => b.id === selected.block.id) + 1;
      } else {
        // Row/Container next to a nested element: place it after the parent.
        const parentId =
          selected.location.type === 'container'
            ? selected.location.containerId
            : selected.location.type === 'column'
              ? selected.location.rowId
              : selected.block.id;
        index = blocks.findIndex((b) => b.id === parentId) + 1;
      }
    }

    setBlocks((prev) => insertBlockAt(prev, location, newBlock, index));
    selectAndEdit(newBlock.id);
  };

  useEffect(() => {
    if (channel !== NotificationChannel.EMAIL || editingId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const { target } = e;
      if (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')
      ) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (!selectedId || !findBlockAnywhere(blocks, selectedId)) return;

      if (e.key === 'Escape') {
        setSelectedId(null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setBlocks((prev) => removeBlockAnywhere(prev, selectedId));
        setSelectedId(null);
      } else if (mod && key === 'd') {
        e.preventDefault();
        const { tree, newId } = duplicateBlock(blocks, selectedId);
        setBlocks(tree);
        setSelectedId(newId);
      } else if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        setBlocks((prev) => moveBlockByOffset(prev, selectedId, e.key === 'ArrowUp' ? -1 : 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setEditingId(selectedId);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [channel, editingId, selectedId, blocks, setBlocks, undo, redo]);

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

          {(type === 'PENDING_ITEMS_DIGEST' || type === 'EXPENSE_SUMMARY') && (
            <div className="bg-muted/40 flex flex-col gap-2 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-muted-foreground">
                Template de relatório agendado: use o elemento <strong>Dados do relatório</strong>{' '}
                para inserir tabelas e gráficos, ou comece pelo modelo pronto.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (
                    blocks.length &&
                    !window.confirm('Substituir o conteúdo atual pelo modelo padrão?')
                  ) {
                    return;
                  }
                  const preset = DEFAULT_REPORT_TEMPLATES[type];
                  setBlocks(structuredClone(preset.blocks));
                  if (!subject) setSubject(preset.subject);
                  if (!name) setName(preset.name);
                }}
              >
                Usar modelo padrão
              </Button>
            </div>
          )}

          <DndContext
            {...dnd.dndContextProps}
            onDragStart={dnd.onDragStart}
            onDragMove={dnd.onDragMove}
            onDragEnd={dnd.onDragEnd}
            onDragCancel={dnd.onDragCancel}
          >
            <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <BlockPalette onAdd={handlePaletteAdd} />
              <Canvas
                blocks={blocks}
                setBlocks={setBlocks}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onEdit={setEditingId}
                activeDrag={dnd.activeDrag}
                dropTarget={dnd.dropTarget}
                history={{ undo, redo, canUndo, canRedo }}
              />
            </div>
            <DragOverlay dropAnimation={null}>
              {dnd.activeDrag && (
                <BlockTypeCard
                  type={dnd.activeDrag.blockType}
                  label={dnd.activeDrag.kind === 'block' ? dnd.activeDrag.name : undefined}
                  description={
                    dnd.activeDrag.kind === 'block' ? 'Movendo elemento' : 'Novo elemento'
                  }
                  className="border-primary w-52 -rotate-2 cursor-grabbing shadow-xl"
                />
              )}
            </DragOverlay>
          </DndContext>

          {editingId && (
            <BlockPropertiesDialog
              key={editingId}
              blocks={blocks}
              setBlocks={setBlocks}
              selectedId={editingId}
              onClose={() => setEditingId(null)}
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
