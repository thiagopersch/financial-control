"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const accountType: { value: AccountType; label: string }[] = [
  { value: AccountType.PIX, label: "PIX" },
  { value: AccountType.CREDIT_CARD, label: "Cartão de Crédito" },
  { value: AccountType.DEBIT_CARD, label: "Cartão de Débito" },
  { value: AccountType.BANK, label: "Banco" },
  { value: AccountType.WALLET, label: "Carteira" },
  { value: AccountType.INVESTMENT, label: "Investimento" },
  { value: AccountType.CRYPTO, label: "Cripto" },
  { value: AccountType.OTHERS, label: "Outros" },
];

const accountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(AccountType),
  balance: z.coerce.number(),
  color: z.string().optional().default("#000000"),
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account?: any;
}

export function AccountModal({ isOpen, onClose, account }: AccountModalProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      name: "",
      type: AccountType.PIX,
      balance: 0,
      color: "#000000",
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        type: account.type,
        balance: Number(account.balance),
        color: account.color || "#000000",
      });
    } else {
      form.reset({
        name: "",
        type: AccountType.PIX,
        balance: 0,
        color: "#000000",
      });
    }
  }, [account, form, isOpen]);

  async function onSubmit(values: AccountFormValues) {
    setLoading(true);
    try {
      if (account) {
        const result = await updateAccount(account.id, values);
        if (result.success) {
          toast.success("Conta atualizada com sucesso", {
            description: "A conta foi atualizada com sucesso",
            position: "bottom-center",
            richColors: true,
          });
          onClose();
        } else {
          toast.error(result.error || "Erro ao atualizar conta", {
            description: "A conta não foi atualizada",
            position: "bottom-center",
            richColors: true,
          });
        }
      } else {
        const result = await createAccount(values);
        if (result.success) {
          toast.success("Conta criada com sucesso", {
            description: "A conta foi criada com sucesso",
            position: "bottom-center",
            richColors: true,
          });
          onClose();
        } else {
          toast.error(result.error || "Erro ao criar conta", {
            description: "A conta não foi criada",
            position: "bottom-center",
            richColors: true,
          });
        }
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado", {
        description: "Ocorreu um erro inesperado",
        position: "bottom-center",
        richColors: true,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-width-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          <DialogDescription>Insira os detalhes da conta abaixo.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nubank, Banco do Brasil, Sicoob" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountType.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="balance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Inicial</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" className="h-10 w-20 p-1" {...field} />
                      <span className="text-muted-foreground text-xs">Identificador visual</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {account ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
