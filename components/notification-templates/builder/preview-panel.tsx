'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { wrapEmailPreviewDocument } from '@/lib/notification-templates/render';
import { cn } from '@/lib/utils';
import { Monitor, Smartphone } from 'lucide-react';
import { useMemo, useState } from 'react';

interface PreviewPanelProps {
  isOpen: boolean;
  onClose: () => void;
  html: string;
}

export function PreviewPanel({ isOpen, onClose, html }: PreviewPanelProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const previewDocument = useMemo(() => wrapEmailPreviewDocument(html), [html]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-4">
            Preview do template
            <div className="flex items-center gap-1 rounded-lg border p-1">
              <Button
                type="button"
                variant={device === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setDevice('desktop')}
              >
                <Monitor className="h-3.5 w-3.5" /> Desktop
              </Button>
              <Button
                type="button"
                variant={device === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setDevice('mobile')}
              >
                <Smartphone className="h-3.5 w-3.5" /> Mobile
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="bg-muted/30 flex flex-col items-center gap-2 py-6">
          <p className="text-muted-foreground text-xs">
            Assim ficará no e-mail — o fundo do conteúdo é sempre claro, independente do tema do
            app.
          </p>
          <iframe
            title="Preview do template"
            srcDoc={previewDocument}
            className={cn(
              'h-[600px] rounded-md border bg-white shadow-sm transition-all',
              device === 'desktop' ? 'w-[600px]' : 'w-[375px]',
            )}
          />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
