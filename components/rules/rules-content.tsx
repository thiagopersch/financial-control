'use client';

import { useState } from 'react';
import { RulesHeader } from './rules-header';
import { RulesList } from './rules-list';

interface RulesContentProps {
  rules: any[];
  categories: { id: string; name: string; type: string; color: string }[];
  canModify?: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
}

export function RulesContent({
  rules,
  categories,
  canModify,
  totalCount,
  page,
  pageSize,
}: RulesContentProps) {
  const [paginationSlot, setPaginationSlot] = useState<HTMLDivElement | null>(null);

  return (
    <>
      <RulesHeader
        categories={categories}
        canModify={canModify}
        paginationSlotRef={setPaginationSlot}
      />
      <RulesList
        rules={rules}
        categories={categories}
        canModify={canModify}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        paginationSlot={paginationSlot}
      />
    </>
  );
}
