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
import { showError, showSuccess } from '@/lib/utils/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.email({ error: 'E-mail inválido' }),
  password: z
    .string()
    .min(6, { error: 'A senha deve ter pelo menos 6 caracteres' })
    .max(30, { error: 'A senha deve ter no máximo 30 caracteres' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        showError('Erro ao fazer login', 'Usuário ou senha incorretos');
        setIsLoading(false);
      } else {
        showSuccess('Login realizado com sucesso!');
        setIsRedirecting(true);
        router.push(callbackUrl);
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
          Entre para gerenciar suas finanças com inteligência
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input
                      id="email"
                      placeholder="jhondoe@email.com"
                      type="email"
                      disabled={isBusy}
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <PasswordInput
                      id="password"
                      placeholder="••••••••"
                      disabled={isLoading}
                      maxLength={30}
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
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center">
        <div className="text-muted-foreground text-sm">
          Ainda não tem uma conta?{' '}
          <Link
            href="/register"
            className="text-primary dark:text-primary font-semibold hover:underline"
          >
            Criar conta
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
