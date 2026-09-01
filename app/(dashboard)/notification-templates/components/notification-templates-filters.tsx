'use client';

import { FilterField, FilterPanel } from '@/components/ui/filter-panel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  NOTIFICATION_CHANNEL_LABELS,
  NOTIFICATION_TYPE_LABELS,
} from '@/lib/notification-templates/labels';
import { useMemo, useState } from 'react';

type NotificationTemplatesFiltersProps = {
  channelFilter: string;
  typeFilter: string;
  statusFilter: string;
  onApply: (values: { channel: string; type: string; status: string }) => void;
  onClear: () => void;
};

export function NotificationTemplatesFilters({
  channelFilter,
  typeFilter,
  statusFilter,
  onApply,
  onClear,
}: NotificationTemplatesFiltersProps) {
  const [channel, setChannel] = useState(channelFilter);
  const [type, setType] = useState(typeFilter);
  const [status, setStatus] = useState(statusFilter);

  // Sincroniza o estado local quando os filtros externos mudam (ex.: "Limpar"),
  // sem usar useEffect — evita o cascading render de setState em effect.
  const [prevFilters, setPrevFilters] = useState({ channelFilter, typeFilter, statusFilter });
  if (
    prevFilters.channelFilter !== channelFilter ||
    prevFilters.typeFilter !== typeFilter ||
    prevFilters.statusFilter !== statusFilter
  ) {
    setPrevFilters({ channelFilter, typeFilter, statusFilter });
    setChannel(channelFilter);
    setType(typeFilter);
    setStatus(statusFilter);
  }

  const typeOptions = useMemo(
    () =>
      Object.entries(NOTIFICATION_TYPE_LABELS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')),
    [],
  );

  const onSelectChange = (setter: (value: string) => void) => (value: string | null) => {
    setter(value || 'all');
  };

  const handleApply = () => {
    onApply({ channel, type, status });
  };

  const handleClear = () => {
    setChannel('all');
    setType('all');
    setStatus('all');
    onClear();
  };

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear} gridClassName="md:grid-cols-3">
      <FilterField label="Canal">
        <Select value={channel} onValueChange={onSelectChange(setChannel)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(NOTIFICATION_CHANNEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Tipo">
        <Select value={type} onValueChange={onSelectChange(setType)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {typeOptions.map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      <FilterField label="Status">
        <Select value={status} onValueChange={onSelectChange(setStatus)}>
          <SelectTrigger className="h-10 w-full">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </FilterField>
    </FilterPanel>
  );
}
