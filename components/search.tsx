'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { Loader2, Search, X } from 'lucide-react';
import { useState } from 'react';

type SearchInputProps = {
  searchParams: URLSearchParams;
  handleSearch: (value: string) => void;
  /** Tempo (ms) sem digitar até a busca ser disparada. */
  debounceMs?: number;
};

export function SearchInput({ searchParams, handleSearch, debounceMs = 400 }: SearchInputProps) {
  const query = searchParams.get('q') ?? '';
  const [value, setValue] = useState(query);
  const [prevQuery, setPrevQuery] = useState(query);

  const search = useDebouncedCallback((next: string) => {
    const term = next.trim();
    if (term !== query) handleSearch(term);
  }, debounceMs);

  // `q` mudou fora do input (busca restaurada, "Limpar filtros"...). Ignora o eco da
  // própria busca e não sobrescreve o que o usuário ainda está digitando.
  if (query !== prevQuery) {
    setPrevQuery(query);
    if (!search.isPending && value.trim() !== query) setValue(query);
  }

  const handleClear = () => {
    setValue('');
    search.cancel();
    if (query) handleSearch('');
  };

  return (
    <div className="flex w-full items-center gap-2 md:w-auto">
      <div className="relative w-full md:w-[25rem]">
        {search.isPending ? (
          <Loader2 className="text-muted-foreground absolute top-3 left-3 h-4 w-4 animate-spin" />
        ) : (
          <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
        )}
        <Input
          type="search"
          aria-label="Buscar"
          placeholder="Buscar por descrição, categoria ou fornecedor..."
          className="bg-background h-10 w-full pr-9 pl-8 shadow-sm [&::-webkit-search-cancel-button]:hidden"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            search.run(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search.flush(e.currentTarget.value);
            } else if (e.key === 'Escape' && value) {
              handleClear();
            }
          }}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            type="button"
            aria-label="Limpar busca"
            className="absolute top-3 right-3 h-4 w-4"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
