"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { register } from "@/lib/actions/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(2, { error: "Nome deve ter pelo menos 2 caracteres" }),
  email: z.email({ error: "E-mail inválido" }),
  password: z.string().min(6, { error: "A senha deve ter pelo menos 6 caracteres" }),
  companyName: z.string().min(2, { error: "O nome da empresa deve ter pelo menos 2 caracteres" }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      companyName: "",
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    try {
      const result = await register(data);

      if (result.success) {
        toast.success("Conta criada com sucesso!");

        // Auto sign in
        await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: true,
          callbackUrl: "/dashboard",
        });
      } else {
        toast.error("Erro ao criar conta", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Erro inesperado", {
        description: "Ocorreu um erro ao processar sua solicitação.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="border-none bg-white/80 shadow-2xl backdrop-blur-xl dark:bg-slate-900/80">
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
                      disabled={isLoading}
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
                  <FormLabel htmlFor="name">Nome</FormLabel>
                  <FormControl>
                    <Input
                      id="name"
                      type="text"
                      disabled={isLoading}
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
                      disabled={isLoading}
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
                    <Input
                      id="password"
                      placeholder="••••••••"
                      type="password"
                      disabled={isLoading}
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
              className="w-full bg-indigo-600 text-lg font-semibold text-white transition-all hover:bg-indigo-700"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta e acessar"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-center">
        <div className="text-muted-foreground text-sm">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Fazer login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
