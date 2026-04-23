import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

type SearchInputProps = {
  searchParams: URLSearchParams;
  handleSearch: (value: string) => void;
};

export function SearchInput({ searchParams, handleSearch }: SearchInputProps) {
  return (
    <div className="mb-4 flex w-5xl items-center gap-2 max-md:w-full">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
        <Input
          placeholder="Buscar por descrição, categoria ou fornecedor..."
          className="bg-background h-10 pl-8 shadow-sm"
          defaultValue={searchParams.get('q') ?? ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(e.currentTarget.value);
            }
          }}
        />
        {searchParams.get('q') && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleSearch('')}
            type="button"
            className="absolute top-3 right-3 h-4 w-4"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
