"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountType } from "@prisma/client";
import { createAccount, updateAccount } from "@/lib/actions/accounts";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

const accountSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.nativeEnum(AccountType),
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
      type: AccountType.BANK,
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
        type: AccountType.BANK,
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
          toast.success("Conta atualizada com sucesso");
          onClose();
        } else {
          toast.error(result.error || "Erro ao atualizar conta");
        }
      } else {
        const result = await createAccount(values);
        if (result.success) {
          toast.success("Conta criada com sucesso");
          onClose();
        } else {
          toast.error(result.error || "Erro ao criar conta");
        }
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-width-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? "Editar Conta" : "Nova Conta"}</DialogTitle>
          <DialogDescription>
            Insira os detalhes da conta abaixo.
          </DialogDescription>
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
                    <Input placeholder="Ex: Nubank, Carteira Principal" {...field} />
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
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={AccountType.BANK}>Banco</SelectItem>
                        <SelectItem value={AccountType.WALLET}>Carteira</SelectItem>
                        <SelectItem value={AccountType.CREDIT_CARD}>Cartão de Crédito</SelectItem>
                        <SelectItem value={AccountType.INVESTMENT}>Investimento</SelectItem>
                        <SelectItem value={AccountType.CRYPTO}>Cripto</SelectItem>
                        <SelectItem value={AccountType.PIX}>PIX</SelectItem>
                        <SelectItem value={AccountType.OTHERS}>Outros</SelectItem>
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
                      <Input type="color" className="p-1 h-10 w-20" {...field} />
                      <span className="text-xs text-muted-foreground">Identificador visual</span>
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
