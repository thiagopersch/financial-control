import {
  DEFAULT_EXTERNAL_API_TIMEOUT_MS,
  MAX_EXTERNAL_API_TIMEOUT_MS,
  MIN_EXTERNAL_API_TIMEOUT_MS,
} from '@/lib/http/fetch-with-timeout';
import * as z from 'zod';

/**
 * Configurações de integração da organização (SMTP, WhatsApp e timeout das
 * APIs externas). Schema único: validado no formulário e na Server Action.
 */
export const workspaceSettingsSchema = z.object({
  whatsappApiUrl: z.string().trim().optional().nullable(),
  whatsappApiToken: z.string().optional().nullable(),
  smtpHost: z.string().trim().optional().nullable(),
  smtpPort: z.coerce.number().int().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().trim().optional().nullable(),
  smtpPassword: z.string().optional().nullable(),
  smtpFrom: z.string().trim().optional().nullable(),
  externalApiTimeoutMs: z.coerce
    .number({ message: 'Informe o tempo limite em milissegundos' })
    .int('Use um número inteiro')
    .min(MIN_EXTERNAL_API_TIMEOUT_MS, `Mínimo de ${MIN_EXTERNAL_API_TIMEOUT_MS} ms`)
    .max(MAX_EXTERNAL_API_TIMEOUT_MS, `Máximo de ${MAX_EXTERNAL_API_TIMEOUT_MS} ms`)
    .default(DEFAULT_EXTERNAL_API_TIMEOUT_MS),
});

export type WorkspaceSettingsInput = z.input<typeof workspaceSettingsSchema>;
export type WorkspaceSettingsValues = z.output<typeof workspaceSettingsSchema>;
