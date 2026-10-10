import * as z from 'zod';

/** Regra única de senha do sistema (criação de usuário, cadastro, troca e redefinição). */
export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 32,
} as const;

export const PASSWORD_REQUIREMENTS = [
  {
    key: 'length',
    label: `Entre ${PASSWORD_RULES.minLength} e ${PASSWORD_RULES.maxLength} caracteres`,
    test: (value: string) =>
      value.length >= PASSWORD_RULES.minLength && value.length <= PASSWORD_RULES.maxLength,
  },
  { key: 'upper', label: 'Uma letra maiúscula', test: (value: string) => /[A-Z]/.test(value) },
  { key: 'lower', label: 'Uma letra minúscula', test: (value: string) => /[a-z]/.test(value) },
  { key: 'number', label: 'Um número', test: (value: string) => /\d/.test(value) },
  {
    key: 'special',
    label: 'Um caractere especial',
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export function getPasswordChecklist(value: string) {
  return PASSWORD_REQUIREMENTS.map(({ key, label, test }) => ({ key, label, met: test(value) }));
}

export function passwordSchema() {
  return z
    .string()
    .min(
      PASSWORD_RULES.minLength,
      `A senha deve ter no mínimo ${PASSWORD_RULES.minLength} caracteres`,
    )
    .max(
      PASSWORD_RULES.maxLength,
      `A senha deve ter no máximo ${PASSWORD_RULES.maxLength} caracteres`,
    )
    .refine((v) => /[A-Z]/.test(v), 'A senha deve conter ao menos uma letra maiúscula')
    .refine((v) => /[a-z]/.test(v), 'A senha deve conter ao menos uma letra minúscula')
    .refine((v) => /\d/.test(v), 'A senha deve conter ao menos um número')
    .refine((v) => /[^A-Za-z0-9]/.test(v), 'A senha deve conter ao menos um caractere especial');
}

/** Nova senha + confirmação (página de redefinição e troca de senha). */
export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema(),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
