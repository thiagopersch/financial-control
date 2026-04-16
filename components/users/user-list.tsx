"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { Role, User } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowUpDown, Edit, Shield, Trash, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { DeleteUserModal } from "./delete-user-modal";
import { UserModal } from "./user-modal";

interface UserListProps {
  users: User[];
  currentUserId: string;
}

const roleConfig: Record<Role, { label: string; className: string }> = {
  ADMIN: {
    label: "Administrador",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  MANAGER: {
    label: "Gerente",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  VIEWER: {
    label: "Visualizador",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
};

export function UserList({ users, currentUserId }: UserListProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Usuário
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === currentUserId;
        return (
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/30">
              <UserIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <span className="text-sm font-semibold">{user.name || "—"}</span>
              {isSelf && <span className="text-muted-foreground ml-2 text-xs">(você)</span>}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          E-mail
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Função
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Badge
            variant="secondary"
            className={cn("gap-1 border-none", roleConfig[user.role].className)}
          >
            {user.role === Role.ADMIN && <Shield className="h-3 w-3" />}
            {roleConfig[user.role].label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 p-0 font-semibold hover:bg-transparent"
        >
          Membro desde
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm" suppressHydrationWarning>
          {mounted
            ? format(new Date(row.original.createdAt), "dd 'de' MMM, yyyy", { locale: ptBR })
            : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => {
        const user = row.original;
        const isSelf = user.id === currentUserId;
        return (
          <div className="space-x-1 text-right whitespace-nowrap">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingUser(user)}
              className="h-8 w-8 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeletingId(user.id)}
              disabled={isSelf}
              className="h-8 w-8 text-rose-500 hover:bg-rose-50 disabled:opacity-30 dark:hover:bg-rose-900/20"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <DataTable
        columns={columns}
        data={users}
        emptyMessage="Nenhum usuário encontrado."
        getRowClassName={(user) =>
          user.id === currentUserId ? "bg-indigo-50/30 dark:bg-indigo-950/10" : ""
        }
      />

      <UserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        initialData={editingUser}
      />
      <DeleteUserModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        id={deletingId || ""}
      />
    </div>
  );
}
