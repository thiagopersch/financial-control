'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { EmailChipsInput } from '@/components/ui/email-chips-input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormDialog } from '@/components/ui/form-dialog';
import { FormTabContent, FormTabsList, type FormTabDefinition } from '@/components/ui/form-tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs } from '@/components/ui/tabs';
import { createScheduledEmail, updateScheduledEmail } from '@/lib/actions/scheduled-emails';
import { REPORT_TYPE_LABELS } from '@/lib/notification-templates/default-report-templates';
import { useNotificationTemplates } from '@/lib/queries/notification-templates-client';
import type { ScheduledEmailDTO } from '@/lib/queries/scheduled-emails-client';
import {
  SCHEDULED_EMAIL_DEFAULTS,
  scheduledEmailSchema,
  type ScheduledEmailInput,
} from '@/lib/schemas/scheduled-email';
import {
  computeNextEmailRun,
  formatInTimeZone,
  getLocalTimeZone,
  WEEKDAY_LABELS,
} from '@/lib/services/email-schedule';
import {
  findFirstTabWithError,
  focusFirstInvalidField,
  getInvalidFieldLabels,
  getTabsWithErrors,
  type TabFieldMap,
} from '@/lib/utils/form-tabs';
import { showError, showSuccess, showWarning } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarClock, ExternalLink, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useForm, useWatch, type FieldErrors } from 'react-hook-form';

type EmailFormTab = 'content' | 'schedule' | 'recipients';

const TABS: readonly FormTabDefinition<EmailFormTab>[] = [
  { value: 'content', label: 'Conteúdo', icon: <FileText /> },
  { value: 'schedule', label: 'Frequência', icon: <CalendarClock /> },
  { value: 'recipients', label: 'Destinatários', icon: <Users /> },
];
const TAB_ORDER = TABS.map((t) => t.value);

const TAB_FIELDS: TabFieldMap<EmailFormTab> = {
  content: [
    'name',
    'reportType',
    'templateId',
    'includeOverdueTransactions',
    'includeOverdueInstallments',
    'includeOpenDebts',
    'summaryPeriodDays',
  ],
  schedule: ['frequency', 'intervalDays', 'dayOfWeek', 'dayOfMonth', 'sendTime', 'skipIfEmpty'],
  recipients: ['toEmails', 'ccEmails'],
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  reportType: 'Tipo',
  templateId: 'Template',
  includeOverdueTransactions: 'Conteúdo do lembrete',
  summaryPeriodDays: 'Período',
  frequency: 'Frequência',
  intervalDays: 'Intervalo',
  dayOfWeek: 'Dia da semana',
  dayOfMonth: 'Dia do mês',
  sendTime: 'Horário',
  toEmails: 'Para',
  ccEmails: 'Cópia',
};

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Diário' },
  { value: 'WEEKLY', label: 'Semanal' },
  { value: 'EVERY_N_DAYS', label: 'A cada N dias' },
  { value: 'MONTHLY', label: 'Mensal' },
] as const;

const DEFAULT_TEMPLATE = '__default__';

function toFormValues(
  item: ScheduledEmailDTO | null,
  fallbackEmail?: string | null,
): ScheduledEmailInput {
  if (!item) {
    return {
      ...SCHEDULED_EMAIL_DEFAULTS,
      timezone: getLocalTimeZone(),
      toEmails: fallbackEmail ? [fallbackEmail] : [],
    };
  }
  return {
    name: item.name,
    reportType: item.reportType,
    templateId: item.templateId,
    frequency: item.frequency,
    intervalDays: item.intervalDays ?? SCHEDULED_EMAIL_DEFAULTS.intervalDays,
    dayOfWeek: item.dayOfWeek ?? SCHEDULED_EMAIL_DEFAULTS.dayOfWeek,
    dayOfMonth: item.dayOfMonth ?? SCHEDULED_EMAIL_DEFAULTS.dayOfMonth,
    sendTime: item.sendTime,
    timezone: item.timezone,
    toEmails: item.toEmails,
    ccEmails: item.ccEmails,
    includeOverdueTransactions: item.includeOverdueTransactions,
    includeOverdueInstallments: item.includeOverdueInstallments,
    includeOpenDebts: item.includeOpenDebts,
    skipIfEmpty: item.skipIfEmpty,
    summaryPeriodDays: item.summaryPeriodDays,
  };
}

const toNumberOrNull = (v: string) => (v === '' ? null : Number(v));

interface ScheduledEmailFormDialogProps {
  isOpen: boolean;
  editing: ScheduledEmailDTO | null;
  currentUserEmail?: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ScheduledEmailFormDialog({
  isOpen,
  editing,
  currentUserEmail,
  onClose,
  onSaved,
}: ScheduledEmailFormDialogProps) {
  const [activeTab, setActiveTab] = useState<EmailFormTab>('content');
  const { templates } = useNotificationTemplates();

  const form = useForm<ScheduledEmailInput>({
    resolver: zodResolver(scheduledEmailSchema),
    defaultValues: toFormValues(editing, currentUserEmail),
  });

  const values = useWatch({ control: form.control });
  const reportType = values.reportType ?? 'PENDING_ITEMS_DIGEST';
  const frequency = values.frequency ?? 'DAILY';
  const timezone = values.timezone || SCHEDULED_EMAIL_DEFAULTS.timezone;

  const templateOptions = useMemo(() => {
    const options = templates
      .filter((t) => t.channel === 'EMAIL' && t.type === reportType)
      .map((t) => ({ id: t.id, name: t.isActive ? t.name : `${t.name} (inativo)` }));
    // Template from another user (list API only returns the viewer's own).
    if (
      editing?.templateId &&
      editing.templateName &&
      !options.some((o) => o.id === editing.templateId)
    ) {
      options.push({ id: editing.templateId, name: editing.templateName });
    }
    return options;
  }, [templates, reportType, editing]);

  const nextRunPreview = (() => {
    const parsed = scheduledEmailSchema.safeParse(values);
    if (
      !parsed.success &&
      parsed.error.issues.some((i) => TAB_FIELDS.schedule.includes(String(i.path[0])))
    ) {
      return null;
    }
    try {
      const next = computeNextEmailRun({
        frequency,
        intervalDays: values.intervalDays,
        dayOfWeek: values.dayOfWeek,
        dayOfMonth: values.dayOfMonth,
        sendTime: values.sendTime || '08:00',
        timezone,
      });
      return formatInTimeZone(next, timezone, { weekday: true, time: true });
    } catch {
      return null;
    }
  })();

  const errorTabs = getTabsWithErrors(form.formState.errors, TAB_FIELDS);

  const onInvalid = (errors: FieldErrors<ScheduledEmailInput>) => {
    const labels = getInvalidFieldLabels(errors, TAB_FIELDS, TAB_ORDER, FIELD_LABELS);
    showWarning('Verifique os campos', labels.join(', '));
    const tab = findFirstTabWithError(errors, TAB_FIELDS, TAB_ORDER);
    if (tab) setActiveTab(tab);
    focusFirstInvalidField();
  };

  const onSubmit = form.handleSubmit(async (data) => {
    const result = editing
      ? await updateScheduledEmail(editing.id, data)
      : await createScheduledEmail(data);
    if (!result.success) {
      showError(result.error);
      return;
    }
    showSuccess(editing ? 'Agendamento atualizado' : 'E-mail agendado');
    onSaved();
    onClose();
  }, onInvalid);

  return (
    <FormDialog
      title={editing ? 'Editar e-mail agendado' : 'Novo e-mail agendado'}
      description="Receba lembretes de pendências ou resumos de despesas por e-mail"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      confirmText={editing ? 'Salvar' : 'Agendar'}
      isSubmitting={form.formState.isSubmitting}
    >
      <Form {...form}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as EmailFormTab)}>
          <FormTabsList tabs={TABS} errorTabs={errorTabs} />

          <FormTabContent value="content">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Lembrete diário de contas vencidas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>Tipo de e-mail</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v);
                      form.setValue('templateId', null);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {reportType === 'PENDING_ITEMS_DIGEST'
                      ? 'Lista o que está vencido/em atraso e as dívidas ainda não quitadas.'
                      : 'Totais, gráficos e maiores despesas do período.'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {reportType === 'PENDING_ITEMS_DIGEST' ? (
              <FormItem>
                <FormLabel required>Incluir no lembrete</FormLabel>
                <div className="space-y-2 rounded-lg border p-3">
                  {(
                    [
                      ['includeOverdueTransactions', 'Transações vencidas'],
                      ['includeOverdueInstallments', 'Parcelas de dívidas em atraso'],
                      ['includeOpenDebts', 'Dívidas em aberto (não quitadas)'],
                    ] as const
                  ).map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name}
                      render={({ field }) => (
                        <label className="flex cursor-pointer items-center gap-2 text-sm">
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                          {label}
                        </label>
                      )}
                    />
                  ))}
                </div>
                {form.formState.errors.includeOverdueTransactions && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.includeOverdueTransactions.message}
                  </p>
                )}
              </FormItem>
            ) : (
              <FormField
                control={form.control}
                name="summaryPeriodDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Período do resumo</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="7">Últimos 7 dias</SelectItem>
                        <SelectItem value="14">Últimos 14 dias</SelectItem>
                        <SelectItem value="30">Últimos 30 dias</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <Select
                    value={field.value ?? DEFAULT_TEMPLATE}
                    onValueChange={(v) => field.onChange(v === DEFAULT_TEMPLATE ? null : v)}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={DEFAULT_TEMPLATE}>Modelo padrão do sistema</SelectItem>
                      {templateOptions.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="flex flex-wrap items-center gap-1">
                    Personalize em Templates de notificação, categoria &quot;
                    {REPORT_TYPE_LABELS[reportType]}&quot;.
                    <Button asChild variant="link" size="sm" className="h-auto p-0">
                      <Link
                        href={
                          field.value
                            ? `/notification-templates/${field.value}`
                            : '/notification-templates/new'
                        }
                        target="_blank"
                      >
                        {field.value ? 'Editar template' : 'Criar template'}
                        <ExternalLink className="size-3" />
                      </Link>
                    </Button>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormTabContent>

          <FormTabContent value="schedule">
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Frequência</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FREQUENCY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sendTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Horário</FormLabel>
                    <FormControl>
                      <Input type="time" step={300} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {frequency === 'EVERY_N_DAYS' && (
              <FormField
                control={form.control}
                name="intervalDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Enviar a cada</FormLabel>
                    <div className="flex flex-wrap items-center gap-2">
                      {[3, 5, 7, 15].map((n) => (
                        <Button
                          key={n}
                          type="button"
                          size="sm"
                          variant={field.value === n ? 'default' : 'outline'}
                          onClick={() => field.onChange(n)}
                        >
                          {n} dias
                        </Button>
                      ))}
                      <FormControl>
                        <Input
                          type="number"
                          min={2}
                          max={90}
                          className="w-24"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(toNumberOrNull(e.target.value))}
                        />
                      </FormControl>
                      <span className="text-muted-foreground text-sm">dias</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {frequency === 'WEEKLY' && (
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Dia da semana</FormLabel>
                    <Select
                      value={field.value != null ? String(field.value) : undefined}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full capitalize">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {WEEKDAY_LABELS.map((label, i) => (
                          <SelectItem key={label} value={String(i)} className="capitalize">
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {frequency === 'MONTHLY' && (
              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Dia do mês</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(toNumberOrNull(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Em meses mais curtos, o envio acontece no último dia do mês.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="skipIfEmpty"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Não enviar quando estiver vazio</FormLabel>
                    <FormDescription>
                      {reportType === 'PENDING_ITEMS_DIGEST'
                        ? 'Pula o envio se não houver nenhuma pendência.'
                        : 'Pula o envio se não houver despesas no período.'}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <p className="bg-muted/50 text-muted-foreground rounded-lg border p-3 text-xs">
              {nextRunPreview ? (
                <>
                  Próximo envio:{' '}
                  <strong className="text-foreground capitalize">{nextRunPreview}</strong> (fuso{' '}
                  {timezone.replace(/_/g, ' ')}).
                </>
              ) : (
                'Preencha a frequência para ver o próximo envio.'
              )}
            </p>
          </FormTabContent>

          <FormTabContent value="recipients">
            <FormField
              control={form.control}
              name="toEmails"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel required>Para</FormLabel>
                  <EmailChipsInput
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={!!fieldState.error}
                  />
                  <FormDescription>
                    Pressione Enter ou vírgula para adicionar cada e-mail.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ccEmails"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Cópia (Cc)</FormLabel>
                  <EmailChipsInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Opcional"
                    aria-invalid={!!fieldState.error}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormTabContent>
        </Tabs>
      </Form>
    </FormDialog>
  );
}
