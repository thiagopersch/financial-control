"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TransactionType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createCategory, updateCategory } from "@/lib/actions/categories";

const categorySchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  type: z.nativeEnum(TransactionType),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Cor inválida"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
}

export function CategoryModal({ isOpen, onClose, initialData }: CategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: TransactionType.INCOME,
      color: "#3b82f6",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        type: initialData.type as TransactionType,
        color: initialData.color,
      });
    } else {
      form.reset({
        name: "",
        type: TransactionType.INCOME,
        color: "#3b82f6",
      });
    }
  }, [initialData, form]);

  async function onSubmit(data: CategoryFormValues) {
    setIsLoading(true);
    try {
      let result;
      if (initialData) {
        result = await updateCategory(initialData.id, data);
      } else {
        result = await createCategory(data);
      }

      if (result.success) {
        toast.success(initialData ? "Categoria atualizada!" : "Categoria criada!");
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          <DialogDescription>
            Defina o nome, tipo e cor da categoria para organizar suas finanças.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((data) => onSubmit(data as CategoryFormValues))} className="space-y-4 pt-4">
          <Field>
            <FieldLabel htmlFor="name">Nome</FieldLabel>
            <Input id="name" placeholder="Ex: Alimentação, Aluguel..." {...form.register("name")} />
            <FieldError errors={[form.formState.errors.name]} />
          </Field>
          
          <Controller
            name="type"
            control={form.control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor="type">Tipo</FieldLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
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
            <FieldLabel htmlFor="color">Cor</FieldLabel>
            <div className="flex gap-4 items-center">
              <Input id="color" type="color" {...form.register("color")} className="h-10 w-20 p-1 cursor-pointer" />
              <span className="text-sm font-mono text-muted-foreground">{form.watch("color")}</span>
            </div>
            <FieldError errors={[form.formState.errors.color]} />
          </Field>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
