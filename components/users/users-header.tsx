'use client';

import { ListPageHeader } from '@/components/ui/list-page-header';

interface UsersHeaderProps {
  canCreate: boolean;
  onCreate: () => void;
  searchParams: URLSearchParams;
  onSearch: (value: string) => void;
  paginationSlotRef?: (node: HTMLDivElement | null) => void;
}

export function UsersHeader({
  canCreate,
  onCreate,
  searchParams,
  onSearch,
  paginationSlotRef,
}: UsersHeaderProps) {
  return (
    <ListPageHeader
      title="Usuários"
      description="Gerencie os acessos e permissões do sistema."
      searchParams={searchParams}
      onSearch={onSearch}
      showFilterToggle={false}
      canCreate={canCreate}
      createLabel="Novo Usuário"
      onCreate={onCreate}
      paginationSlotRef={paginationSlotRef}
    />
  );
}
