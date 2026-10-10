'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { resetUserPassword } from '@/lib/actions/users';
import { showError, showSuccess } from '@/lib/utils/toast';
import { Check, Copy, Loader2, TriangleAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ResetPasswordModalProps {
  user: { id: string; name: string | null; email: string } | null;
  onClose: () => void;
}

/**
 * Confirmação + exibição da senha temporária. A senha só existe neste estado local:
 * é mostrada uma única vez e descartada ao fechar.
 */
export function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    if (isLoading) return;
    setTemporaryPassword(null);
    setCopied(false);
    onClose();
  };

  async function handleConfirm() {
    if (!user) return;
    setIsLoading(true);
    try {
      const result = await resetUserPassword(user.id);
      if (result.success) {
        setTemporaryPassword(result.temporaryPassword);
        router.refresh();
      } else {
        showError('Não foi possível gerar a senha', result.error);
      }
    } catch {
      showError('Erro inesperado ao gerar a senha temporária.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy() {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      showSuccess('Senha copiada!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('Não foi possível copiar. Selecione a senha e copie manualmente.');
    }
  }

  const userLabel = user?.name || user?.email;

  return (
    <AlertDialog open={!!user} onOpenChange={(open) => !open && handleClose()}>
      <AlertDialogContent>
        {temporaryPassword ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Senha temporária gerada</AlertDialogTitle>
              <AlertDialogDescription>
                Envie esta senha para <strong>{userLabel}</strong>. No próximo acesso, será
                obrigatório definir uma nova senha.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2">
              <code className="bg-muted flex-1 rounded-md border px-3 py-2 font-mono text-sm break-all select-all">
                {temporaryPassword}
              </code>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
                aria-label="Copiar senha"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground flex items-start gap-2 text-xs">
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              Esta senha será exibida apenas uma vez. Copie antes de fechar.
            </p>
            <AlertDialogFooter>
              <Button type="button" onClick={handleClose}>
                Concluir
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Gerar senha temporária?</AlertDialogTitle>
              <AlertDialogDescription>
                A senha atual de <strong>{userLabel}</strong> deixará de funcionar. Uma senha
                temporária será gerada e o usuário precisará redefini-la no próximo acesso.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
              <Button type="button" onClick={handleConfirm} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerar senha
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
