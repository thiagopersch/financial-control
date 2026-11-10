'use client';

import MuiTable from '@mui/material/Table';
import MuiTableBody from '@mui/material/TableBody';
import MuiTableCell from '@mui/material/TableCell';
import MuiTableFooter from '@mui/material/TableFooter';
import MuiTableHead from '@mui/material/TableHead';
import MuiTableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import * as React from 'react';

/** Tabela do app sobre o MUI `Table` (mesma API de elementos de antes). */
type Rest = Record<string, unknown>;

export function Table({ className, children, ...props }: React.ComponentProps<'table'>) {
  return (
    <Box
      data-slot="table-container"
      sx={{ position: 'relative', width: '100%', overflowX: 'auto' }}
    >
      <MuiTable data-slot="table" size="small" className={className} {...(props as Rest)}>
        {children}
      </MuiTable>
    </Box>
  );
}

export function TableHeader({ className, children, ...props }: React.ComponentProps<'thead'>) {
  return (
    <MuiTableHead data-slot="table-header" className={className} {...(props as Rest)}>
      {children}
    </MuiTableHead>
  );
}

export function TableBody({ className, children, ...props }: React.ComponentProps<'tbody'>) {
  return (
    <MuiTableBody
      data-slot="table-body"
      className={className}
      sx={{ '& tr:last-of-type td': { borderBottom: 0 } }}
      {...(props as Rest)}
    >
      {children}
    </MuiTableBody>
  );
}

export function TableFooter({ className, children, ...props }: React.ComponentProps<'tfoot'>) {
  return (
    <MuiTableFooter
      data-slot="table-footer"
      className={className}
      sx={{ bgcolor: 'action.hover', '& td': { fontWeight: 500, color: 'text.primary' } }}
      {...(props as Rest)}
    >
      {children}
    </MuiTableFooter>
  );
}

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.ComponentProps<'tr'> & { sx?: SxProps<Theme> }
>(function TableRow({ className, children, sx, ...props }, ref) {
  return (
    <MuiTableRow
      ref={ref}
      hover
      data-slot="table-row"
      className={className}
      sx={[
        { '&[data-state=selected]': { bgcolor: 'action.selected' } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...(props as Rest)}
    >
      {children}
    </MuiTableRow>
  );
});

export function TableHead({ className, children, ...props }: React.ComponentProps<'th'>) {
  return (
    <MuiTableCell
      component="th"
      data-slot="table-head"
      className={className}
      sx={{ height: 40, fontWeight: 500, color: 'text.primary', whiteSpace: 'nowrap', px: 1 }}
      {...(props as Rest)}
    >
      {children}
    </MuiTableCell>
  );
}

export function TableCell({ className, children, ...props }: React.ComponentProps<'td'>) {
  return (
    <MuiTableCell
      data-slot="table-cell"
      className={className}
      sx={{ px: 1, whiteSpace: 'nowrap', verticalAlign: 'middle' }}
      {...(props as Rest)}
    >
      {children}
    </MuiTableCell>
  );
}

export function TableCaption({ className, children }: React.ComponentProps<'caption'>) {
  return (
    <Box
      component="caption"
      className={className}
      sx={{ mt: 2, color: 'text.secondary', typography: 'caption', captionSide: 'bottom' }}
    >
      {children}
    </Box>
  );
}
