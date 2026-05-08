'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TagsHeaderProps {
  onCreate: () => void;
}

export function TagsHeader({ onCreate }: TagsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-3xl font-bold tracking-tight max-md:text-2xl">Tags</h1>
        <p className="text-muted-foreground max-md:text-sm">
          Gerencie as tags utilizadas para categorizar suas transações.
        </p>
      </div>
      <Button onClick={onCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Nova Tag
      </Button>
    </div>
  );
}
