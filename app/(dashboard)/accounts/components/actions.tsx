import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { AccountDTO } from '@/lib/queries/accounts';
import { MoreHorizontal, Pencil, Trash2, Wallet } from 'lucide-react';

export function ActionsAccounts({
  accounts,
  openEdit,
  handleDelete,
  typeIcons,
  typeLabels,
}: {
  accounts: AccountDTO[];
  openEdit: (account: AccountDTO) => void;
  handleDelete: (id: string) => void;
  typeIcons: Record<string, React.ElementType>;
  typeLabels: Record<string, string>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {accounts.map((account) => {
        const Icon = typeIcons[account.type] || Wallet;
        const label = typeLabels[account.type] || 'Outro';

        return (
          <Card
            key={account.id}
            className="cursor-pointer overflow-hidden rounded-tl-2xl rounded-bl-2xl border-l-4 transition-all ease-in-out hover:border-l-8 hover:shadow-md"
            style={{ borderLeftColor: account.color || '#000000' }}
            onClick={() => openEdit(account)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <div className="bg-muted rounded-lg p-2">
                  <Icon className="text-primary h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">{account.name}</CardTitle>
                  <CardDescription className="text-xs">{label}</CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => openEdit(account)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(account.id);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
