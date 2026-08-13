'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { FormDialog } from '@/components/ui/form-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  createNotificationTemplate,
  deleteNotificationTemplate,
  toggleNotificationTemplate,
  updateNotificationTemplate,
} from '@/lib/actions/notification-templates';
import {
  useNotificationTemplates,
  type NotificationTemplateDTO,
} from '@/lib/queries/notification-templates-client';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { NotificationChannel, NotificationType } from '@prisma/client';
import { ImageIcon, Loader2, Mail, MessageCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const TYPE_LABELS: Record<string, string> = {
  BUDGET_WARNING: 'Alerta de orçamento',
  BUDGET_EXCEEDED: 'Orçamento excedido',
  INVOICE_DUE: 'Fatura a vencer',
  INVOICE_OVERDUE: 'Fatura vencida',
  GOAL_PROGRESS: 'Progresso de meta',
  DEBT_ALERT: 'Alerta de dívida',
  DEBT_DUE_SOON: 'Dívida a vencer',
  DEBT_OVERDUE: 'Dívida vencida',
  RECURRING_REMINDER: 'Lembrete recorrente',
  TRANSACTION_DUE_SOON: 'Transação a vencer',
  TRANSACTION_OVERDUE: 'Transação vencida',
  ANOMALY_DETECTED: 'Anomalia detectada',
  CARD_LIMIT_WARNING: 'Cartão perto do limite',
  CARD_LIMIT_EXCEEDED: 'Limite do cartão estourado',
  SYSTEM: 'Geral / Automação',
};

const CHANNEL_LABELS: Record<string, string> = {
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp',
};

const TEMPLATE_VARIABLES = [
  { label: 'Título', key: 'title' },
  { label: 'Mensagem', key: 'message' },
  { label: 'Valor', key: 'amount' },
  { label: 'Categoria', key: 'category' },
  { label: 'Descrição', key: 'description' },
  { label: 'Cartão', key: 'cardName' },
  { label: 'Percentual', key: 'percentage' },
];

const templateSchema = z
  .object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.enum(NotificationType),
    channel: z.enum(NotificationChannel),
    subject: z.string(),
    bodyHtml: z.string(),
    bodyWhatsapp: z.string(),
    imageUrl: z.string().nullable().optional(),
  })
  .refine((data) => data.channel !== NotificationChannel.EMAIL || data.subject.length > 0, {
    message: 'Assunto é obrigatório',
    path: ['subject'],
  })
  .refine((data) => data.channel !== NotificationChannel.EMAIL || data.bodyHtml.length > 0, {
    message: 'Corpo do e-mail é obrigatório',
    path: ['bodyHtml'],
  })
  .refine((data) => data.channel !== NotificationChannel.WHATSAPP || data.bodyWhatsapp.length > 0, {
    message: 'Mensagem do WhatsApp é obrigatória',
    path: ['bodyWhatsapp'],
  });

type TemplateFormValues = z.infer<typeof templateSchema>;

export function NotificationTemplatesSection() {
  const { templates, isLoading, refresh } = useNotificationTemplates();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selected, setSelected] = useState<NotificationTemplateDTO | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.EMAIL,
      subject: '',
      bodyHtml: '',
      bodyWhatsapp: '',
      imageUrl: null,
    },
  });

  const imageUrl = form.watch('imageUrl');
  const selectedChannel = form.watch('channel');

  const openCreate = () => {
    setSelected(null);
    form.reset({
      name: '',
      type: NotificationType.SYSTEM,
      channel: NotificationChannel.EMAIL,
      subject: '',
      bodyHtml: '',
      bodyWhatsapp: '',
      imageUrl: null,
    });
    setIsFormOpen(true);
  };

  const openEdit = (template: NotificationTemplateDTO) => {
    setSelected(template);
    form.reset({
      name: template.name,
      type: template.type as NotificationType,
      channel: template.channel,
      subject: template.subject,
      bodyHtml: template.bodyHtml,
      bodyWhatsapp: template.bodyWhatsapp,
      imageUrl: template.imageUrl,
    });
    setIsFormOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/notification-templates/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        form.setValue('imageUrl', data.url);
      } else {
        showError(data.error || 'Erro ao enviar imagem');
      }
    } finally {
      setIsUploadingCover(false);
    }
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const result = selected
      ? await updateNotificationTemplate(selected.id, data)
      : await createNotificationTemplate({ ...data, isActive: true });

    if (result.success) {
      showSuccess(selected ? 'Template atualizado com sucesso' : 'Template criado com sucesso');
      setIsFormOpen(false);
      refresh();
    } else {
      showError(result.error || 'Erro ao salvar template');
    }
  });

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    const result = await deleteNotificationTemplate(templateToDelete);
    if (result.success) {
      showSuccess('Template excluído com sucesso');
      refresh();
    } else {
      showError(result.error || 'Erro ao excluir template');
    }
    setIsDeleteOpen(false);
    setTemplateToDelete(null);
  };

  const handleToggle = async (template: NotificationTemplateDTO) => {
    const result = await toggleNotificationTemplate(template.id, !template.isActive);
    if (result.success) refresh();
    else showError(result.error || 'Erro ao atualizar template');
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Notificações personalizadas</CardTitle>
          <p className="text-muted-foreground text-sm">
            Personalize o conteúdo de e-mail e WhatsApp enviado para cada tipo de notificação, ou
            crie um template para usar no Fluxo de Automação.
          </p>
        </div>
        <Button onClick={openCreate} size="sm" className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Novo template
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-muted-foreground text-sm">Carregando...</p>}
        {!isLoading && templates.length === 0 && (
          <p className="text-muted-foreground text-sm">
            Nenhum template personalizado criado ainda. As notificações usarão o conteúdo padrão do
            sistema.
          </p>
        )}
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {template.channel === 'WHATSAPP' ? (
                  <MessageCircle className="text-muted-foreground h-4 w-4 shrink-0" />
                ) : (
                  <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
                )}
                <span className="truncate font-medium">{template.name}</span>
                <Badge variant="outline" className="shrink-0">
                  {CHANNEL_LABELS[template.channel] || template.channel}
                </Badge>
                <Badge variant="secondary" className="shrink-0">
                  {TYPE_LABELS[template.type] || template.type}
                </Badge>
                {template.imageUrl && <ImageIcon className="text-muted-foreground h-3.5 w-3.5" />}
              </div>
              <p className="text-muted-foreground truncate text-xs">
                {template.channel === 'WHATSAPP'
                  ? template.bodyWhatsapp.replace(/<[^>]*>/g, ' ').trim()
                  : template.subject}
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              <Switch checked={template.isActive} onCheckedChange={() => handleToggle(template)} />
              <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/20"
                onClick={() => handleDelete(template.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      <FormDialog
        title={selected ? 'Editar template' : 'Novo template de notificação'}
        description="O conteúdo é usado no e-mail e no WhatsApp enviados para esse tipo de notificação."
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={onSubmit}
        confirmText="Salvar"
        cancelText="Cancelar"
        isSubmitting={form.formState.isSubmitting}
      >
        <Form {...form}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Alerta de limite personalizado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(NotificationType).map((type) => (
                          <SelectItem key={type} value={type}>
                            {TYPE_LABELS[type] || type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Canal</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(NotificationChannel).map((channel) => (
                        <SelectItem key={channel} value={channel}>
                          {CHANNEL_LABELS[channel] || channel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedChannel === NotificationChannel.EMAIL && (
              <>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Assunto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Seu cartão {{cardName}} está no limite"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bodyHtml"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Corpo do e-mail</FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value}
                          onChange={field.onChange}
                          variables={TEMPLATE_VARIABLES}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {selectedChannel === NotificationChannel.WHATSAPP && (
              <FormField
                control={form.control}
                name="bodyWhatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Mensagem do WhatsApp</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        variables={TEMPLATE_VARIABLES}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">Imagem de capa (opcional)</span>
              {imageUrl ? (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl}
                    alt="Capa do template"
                    className="max-h-40 rounded-md border object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="bg-background absolute -top-2 -right-2 h-6 w-6 rounded-full border shadow-sm"
                    onClick={() => form.setValue('imageUrl', null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-fit"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={isUploadingCover}
                >
                  {isUploadingCover ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  Enviar imagem
                </Button>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleCoverUpload}
              />
            </div>

            <p className="text-muted-foreground bg-muted/50 rounded-lg border p-3 text-xs">
              Use variáveis como <code>{'{{cardName}}'}</code>, <code>{'{{amount}}'}</code>,{' '}
              <code>{'{{percentage}}'}</code>, <code>{'{{category}}'}</code>,{' '}
              <code>{'{{description}}'}</code> no assunto e no corpo — elas serão substituídas pelos
              dados reais ao enviar.
            </p>
          </div>
        </Form>
      </FormDialog>

      <DeleteConfirmModal
        title="Excluir template de notificação"
        description="Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita."
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </Card>
  );
}
