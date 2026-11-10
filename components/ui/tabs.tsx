'use client';

import Box from '@mui/material/Box';
import MuiTab, { type TabProps } from '@mui/material/Tab';
import MuiTabs from '@mui/material/Tabs';
import * as React from 'react';

/**
 * Abas (MUI `Tabs`/`Tab`) com a API composta de antes:
 * `<Tabs value onValueChange><TabsList><TabsTrigger value/></TabsList><TabsContent value/></Tabs>`.
 */
interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used inside <Tabs>');
  return ctx;
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children?: React.ReactNode;
}) {
  const [internal, setInternal] = React.useState(defaultValue ?? '');
  const current = value ?? internal;
  const ctx = React.useMemo(
    () => ({
      value: current,
      setValue: (next: string) => {
        if (value === undefined) setInternal(next);
        onValueChange?.(next);
      },
      orientation,
    }),
    [current, value, onValueChange, orientation],
  );
  return (
    <TabsContext.Provider value={ctx}>
      <Box
        data-slot="tabs"
        data-orientation={orientation}
        className={className}
        sx={{
          display: 'flex',
          gap: 1,
          flexDirection: orientation === 'horizontal' ? 'column' : 'row',
        }}
      >
        {children}
      </Box>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  variant = 'default',
  children,
}: {
  className?: string;
  variant?: 'default' | 'line';
  children?: React.ReactNode;
}) {
  const { value, setValue, orientation } = useTabs();
  const isLine = variant === 'line';
  return (
    <MuiTabs
      data-slot="tabs-list"
      data-variant={variant}
      value={value || false}
      onChange={(_e, next: string) => setValue(next)}
      orientation={orientation}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      className={className}
      slotProps={isLine ? undefined : { indicator: { style: { display: 'none' } } }}
      sx={{
        minHeight: 32,
        width: 'fit-content',
        maxWidth: '100%',
        ...(isLine ? {} : { bgcolor: 'action.hover', borderRadius: 1, p: '3px' }),
      }}
    >
      {children}
    </MuiTabs>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  disabled,
  ...muiInjected
}: {
  value: string;
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
} & Omit<Partial<TabProps>, 'children' | 'value' | 'className'>) {
  return (
    <MuiTab
      {...(muiInjected as TabProps)}
      value={value}
      disabled={disabled}
      disableRipple
      className={className}
      label={children}
      data-slot="tabs-trigger"
      sx={{
        minHeight: 26,
        minWidth: 0,
        px: 1.25,
        py: 0.5,
        fontSize: '0.875rem',
        borderRadius: 0.75,
        color: 'text.secondary',
        flexDirection: 'row',
        gap: 0.75,
        '& svg': { width: 16, height: 16 },
        // M3: abas usam realce de cor, não um controle segmentado com sombra.
        '&.Mui-selected': { color: 'text.primary', bgcolor: 'background.paper' },
        '& .MuiTab-iconWrapper': { m: 0 },
      }}
    />
  );
}

export function TabsContent({
  value,
  className,
  children,
  forceMount,
}: {
  value: string;
  className?: string;
  children?: React.ReactNode;
  forceMount?: boolean;
}) {
  const { value: current } = useTabs();
  const active = current === value;
  if (!active && !forceMount) return null;
  return (
    <Box
      data-slot="tabs-content"
      role="tabpanel"
      hidden={!active}
      className={className}
      sx={{ flex: 1, fontSize: '0.875rem', outline: 'none' }}
    >
      {children}
    </Box>
  );
}

/** Compat: o visual vem do MUI. */
export function tabsListVariants(_opts?: { variant?: 'default' | 'line' }) {
  return '';
}
