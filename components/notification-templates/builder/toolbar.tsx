'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '@/lib/notification-templates/labels';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { Eye, Loader2, Save, X } from 'lucide-react';

interface ToolbarProps {
  name: string;
  onNameChange: (value: string) => void;
  type: NotificationType;
  onTypeChange: (value: NotificationType) => void;
  channel: NotificationChannel;
  onChannelChange: (value: NotificationChannel) => void;
  onPreview: () => void;
  onCancel: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export function Toolbar({
  name,
  onNameChange,
  type,
  onTypeChange,
  channel,
  onChannelChange,
  onPreview,
  onCancel,
  onSave,
  isSaving,
}: ToolbarProps) {
  return (
    <div className="bg-background sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b py-3">
      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Nome do template"
        className="max-w-xs font-medium"
      />

      <Select value={channel} onValueChange={(v) => onChannelChange(v as NotificationChannel)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(NotificationChannel).map((c) => (
            <SelectItem key={c} value={c}>
              {NOTIFICATION_CHANNEL_LABELS[c] || c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type} onValueChange={(v) => onTypeChange(v as NotificationType)}>
        <SelectTrigger className="w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(NotificationType).map((t) => (
            <SelectItem key={t} value={t}>
              {NOTIFICATION_TYPE_LABELS[t] || t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" /> Cancelar
        </Button>
        {channel === NotificationChannel.EMAIL && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={onPreview}>
            <Eye className="h-4 w-4" /> Preview
          </Button>
        )}
        <Button type="button" size="sm" className="gap-1.5" onClick={onSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}
