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
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { register } from '@/lib/actions/auth';
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, { error: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { error: 'Nome deve ter no máximo 100 caracteres' }),
  email: z
    .email({ error: 'E-mail inválido' })
    .max(160, { error: 'E-mail deve ter no máximo 160 caracteres' }),
  password: z
    .string()
    .min(6, { error: 'A senha deve ter pelo menos 6 caracteres' })
    .max(32, { error: 'A senha deve ter no máximo 32 caracteres' }),
  companyName: z
    .string()
    .min(2, { error: 'O nome da empresa deve ter pelo menos 2 caracteres' })
    .max(100, { error: 'O nome da empresa deve ter no máximo 100 caracteres' }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      companyName: '',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      const result = await register(data);

      if (result.success) {
        showSuccess('Conta criada com sucesso!');
        setIsRedirecting(true);

        // Auto sign in
        await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: true,
          callbackUrl: '/dashboard',
        });
      } else {
        showError('Erro ao criar conta', result.error);
        setIsLoading(false);
      }
    } catch {
      showError('Erro inesperado', 'Ocorreu um erro ao processar sua solicitação.');
      setIsLoading(false);
    }
  }

  const isBusy = isLoading || isRedirecting;

  return (
    <Card className="relative border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/80">
      {isRedirecting && (
        <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl backdrop-blur-sm">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p className="text-muted-foreground text-sm">Redirecionando para o dashboard...</p>
        </div>
      )}
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-primary dark:text-primary text-3xl font-bold tracking-tight">
          {process.env.NEXT_PUBLIC_APP_NAME}
        </CardTitle>
        <CardDescription className="text-sm max-md:text-xs">
          Comece a controlar sua empresa hoje mesmo
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="companyName">Nome da sua Empresa / Workspace</FormLabel>
                  <FormControl>
                    <Input
                      id="companyName"
                      placeholder="Minha Empresa Ltda"
                      disabled={isBusy}
                      maxLength={100}
                      className="bg-white/50 dark:bg-slate-800/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">Nome do usuário</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      type="text"
                      disabled={isBusy}
                      maxLength={100}
                      className="bg-white/50 dark:bg-slate-800/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="email">E-mail</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="seu@email.com"
                      type="email"
                      disabled={isBusy}
                      maxLength={160}
                      className="bg-white/50 dark:bg-slate-800/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">Senha</FormLabel>
                  <FormControl>
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      disabled={isBusy}
                      maxLength={32}
                      className="bg-white/50 dark:bg-slate-800/50"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 w-full text-lg font-semibold text-white transition-all"
              size="lg"
              disabled={isBusy}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Redirecionando...
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta e acessar'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center">
        <div className="text-muted-foreground text-sm">
          Já tem uma conta?{' '}
          <Link
            href="/login"
            className="text-primary dark:text-primary font-semibold hover:underline"
          >
            Fazer login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
