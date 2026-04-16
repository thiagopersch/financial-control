"use client";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Supplier } from "@prisma/client";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash, User } from "lucide-react";
import { useState } from "react";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { SupplierModal } from "./supplier-modal";

interface SupplierListProps {
  suppliers: Supplier[];
  userRole?: string;
}

export function SupplierList({ suppliers, userRole }: SupplierListProps) {
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const initialColumns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Nome
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <User className="h-4 w-4" />
          </div>
          <span className="font-semibold">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "document",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Documento
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.document || "-"}</span>,
    },
    {
      accessorKey: "contact",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Contato
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.contact || "-"}</span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="space-x-2 text-right whitespace-nowrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingSupplier(row.original)}
            className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeletingId(row.original.id)}
            className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const columns = initialColumns.filter((col) => col.id !== "actions" || userRole !== "VIEWER");

  const table = useReactTable({
    data: suppliers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={suppliers}
        emptyMessage="Nenhum fornecedor cadastrado."
        getRowClassName={(row) => (row.id === deletingId ? "bg-rose-50 dark:bg-rose-900/20" : "")}
      />

      <SupplierModal
        isOpen={!!editingSupplier}
        onClose={() => setEditingSupplier(null)}
        initialData={editingSupplier}
      />

      <DeleteConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        id={deletingId || ""}
      />
    </div>
  );
}
