"use client";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { zodResolver } from "@hookform/resolvers/zod";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const transactionSchema = z.object({
  type: z.enum(TransactionType),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  date: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
  status: z.enum(TransactionStatus),
  categoryId: z.string().min(1, "Categoria é obrigatória"),
  supplierId: z.string().nullable().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: string; name: string; type: string; color: string }[];
  suppliers: { id: string; name: string }[];
  initialData?: any;
}

export function TransactionModal({
  isOpen,
  onClose,
  categories,
  suppliers,
  initialData,
}: TransactionModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: TransactionType.EXPENSE,
      amount: 0,
      date: new Date(),
      status: TransactionStatus.PENDING,
      categoryId: "",
      supplierId: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        type: initialData.type,
        amount: Number(initialData.amount),
        date: new Date(initialData.date),
        dueDate: initialData.dueDate ? new Date(initialData.dueDate) : null,
        status: initialData.status,
        categoryId: initialData.categoryId,
        supplierId: initialData.supplierId,
        notes: initialData.notes || "",
      });
    } else {
      form.reset({
        type: TransactionType.EXPENSE,
        amount: 0,
        date: new Date(),
        status: TransactionStatus.PENDING,
        categoryId: "",
        supplierId: null,
        notes: "",
      });
    }
  }, [initialData, form]);

  const selectedType = form.watch("type");
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  async function onSubmit(data: TransactionFormValues) {
    setIsLoading(true);
    try {
      let result;
      if (initialData) {
        result = await updateTransaction(initialData.id, data);
      } else {
        result = await createTransaction(data);
      }

      if (result.success) {
        toast.success(initialData ? "Transação atualizada!" : "Transação criada!");
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Transação" : "Nova Transação"}</DialogTitle>
          <DialogDescription>Insira os detalhes da receita ou despesa.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) => onSubmit(data as unknown as TransactionFormValues))}
          className="space-y-4 pt-4"
        >
          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Controller
              name="type"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="type">Tipo</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionType.INCOME}>Receita</SelectItem>
                      <SelectItem value={TransactionType.EXPENSE}>Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.type]} />
                </Field>
              )}
            />
            <Field>
              <FieldLabel htmlFor="amount">Valor (R$)</FieldLabel>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...form.register("amount")}
              />
              <FieldError errors={[form.formState.errors.amount]} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <Controller
              name="date"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="date">Data</FieldLabel>
                  <DatePicker date={field.value} setDate={field.onChange} />
                  <FieldError errors={[form.formState.errors.date]} />
                </Field>
              )}
            />
            <Controller
              name="status"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="status">Status</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TransactionStatus.PAID}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500" />
                          Pago
                        </div>
                      </SelectItem>
                      <SelectItem value={TransactionStatus.PENDING}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-amber-500" />
                          Pendente
                        </div>
                      </SelectItem>
                      <SelectItem value={TransactionStatus.OVERDUE}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-rose-500" />
                          Atrasado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[form.formState.errors.status]} />
                </Field>
              )}
            />
          </div>

          <Controller
            name="categoryId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="categoryId">Categoria</FieldLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.categoryId]} />
              </Field>
            )}
          />

          <Controller
            name="supplierId"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="supplierId">Fornecedor / Cliente (Opcional)</FieldLabel>
                <Select onValueChange={field.onChange} value={field.value || "none"}>
                  <SelectTrigger id="supplierId">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {suppliers.map((sup) => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.supplierId]} />
              </Field>
            )}
          />

          <Field>
            <FieldLabel htmlFor="notes">Observações</FieldLabel>
            <Input id="notes" placeholder="Detalhes da transação..." {...form.register("notes")} />
            <FieldError errors={[form.formState.errors.notes]} />
          </Field>

          <div className="flex justify-end gap-2 pt-4 max-md:flex-col-reverse">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
