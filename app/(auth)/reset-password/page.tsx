'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordRequirements } from '@/components/ui/password-requirements';
import { completeForcedPasswordReset } from '@/lib/actions/profiles';
import { showError, showSuccess } from '@/lib/utils/toast';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validations/password';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Loader2, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

export default function ResetPasswordPage() {
  const { update } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  async function onSubmit(data: ResetPasswordValues) {
    setIsLoading(true);
    try {
      const result = await completeForcedPasswordReset(data);
      if (!result.success) {
        showError('Não foi possível redefinir a senha', result.error);
        setIsLoading(false);
        return;
      }

      showSuccess('Senha redefinida com sucesso!');
      setIsRedirecting(true);
      // Regrava o cookie da sessão sem a pendência antes de sair daqui — senão o proxy,
      // que lê o JWT do cookie, mandaria o usuário de volta para esta página.
      await update();
      window.location.assign(result.redirectTo);
    } catch {
      showError('Erro inesperado', 'Ocorreu um erro ao redefinir sua senha.');
      setIsLoading(false);
    }
  }

  const isBusy = isLoading || isRedirecting;

  return (
    <Card className="relative border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/80">
      {isRedirecting && (
        <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-sm">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Liberando seu acesso...</p>
        </div>
      )}
      <CardHeader className="space-y-2 text-center">
        <div className="bg-primary/10 mx-auto w-fit rounded-full p-3">
          <KeyRound className="text-primary h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Redefinir senha</CardTitle>
        <CardDescription className="text-sm max-md:text-xs">
          Por segurança, defina uma nova senha para continuar acessando o sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="••••••••"
                      autoComplete="new-password"
                      maxLength={32}
                      disabled={isBusy}
                      {...field}
                    />
                  </FormControl>
                  <PasswordRequirements value={field.value} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Repita a nova senha"
                      autoComplete="new-password"
                      maxLength={32}
                      disabled={isBusy}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full font-semibold" size="lg" disabled={isBusy}>
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Redefinir e continuar
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isBusy}
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </CardFooter>
    </Card>
  );
}
