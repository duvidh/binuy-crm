import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import { ArrowUpDown, MessageCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPhone, whatsappLink } from '@/lib/format';
import { leadTypeLabel, leadTypeVariant, statusLabel } from '@/lib/contactMeta';
import { he } from '@/locales/he';
import type { Contact } from '@/types';

interface Props {
  contacts: Contact[];
  selected: Record<string, boolean>;
  onSelectedChange: (next: Record<string, boolean>) => void;
  sortBy: string;
  sortDir: string;
  onSort: (col: string) => void;
}

export function ContactsTable({ contacts, selected, onSelectedChange, sortBy, sortDir, onSort }: Props) {
  const navigate = useNavigate();
  const f = he.contacts.fields;

  const allChecked = contacts.length > 0 && contacts.every((c) => selected[c.id]);

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allChecked}
            onCheckedChange={(v) => {
              const next = { ...selected };
              contacts.forEach((c) => (next[c.id] = !!v));
              onSelectedChange(next);
            }}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={!!selected[row.original.id]}
            onCheckedChange={(v) => onSelectedChange({ ...selected, [row.original.id]: !!v })}
            onClick={(e) => e.stopPropagation()}
          />
        ),
      },
      { accessorKey: 'fullName', header: f.fullName, cell: ({ row }) => <span className="font-medium">{row.original.fullName}</span> },
      {
        accessorKey: 'phone',
        header: f.phone,
        cell: ({ row }) => (
          <div className="flex items-center gap-2" dir="ltr">
            <span>{formatPhone(row.original.phone)}</span>
            <a href={whatsappLink(row.original.phone)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-success">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        ),
      },
      { accessorKey: 'city', header: f.city, cell: ({ row }) => row.original.city ?? '—' },
      { accessorKey: 'projectType', header: f.projectType, cell: ({ row }) => row.original.projectType ?? '—' },
      { accessorKey: 'budget', header: f.budget, cell: ({ row }) => (row.original.budget != null ? formatCurrency(row.original.budget) : '—') },
      {
        accessorKey: 'leadType',
        header: f.leadType,
        cell: ({ row }) => <Badge variant={leadTypeVariant[row.original.leadType]}>{leadTypeLabel(row.original.leadType)}</Badge>,
      },
      {
        accessorKey: 'status',
        header: f.status,
        cell: ({ row }) => <Badge variant={row.original.status === 'CUSTOMER' ? 'success' : 'outline'}>{statusLabel(row.original.status)}</Badge>,
      },
      { id: 'assignee', header: f.assignedTo, cell: ({ row }) => row.original.assignedTo?.name ?? '—' },
    ],
    [contacts, selected, allChecked, onSelectedChange, f],
  );

  const table = useReactTable({ data: contacts, columns, getCoreRowModel: getCoreRowModel() });
  const SORTABLE = new Set(['fullName', 'phone', 'city', 'budget', 'leadType', 'status']);

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => {
                const colId = header.column.id;
                const sortable = SORTABLE.has(colId);
                return (
                  <TableHead key={header.id}>
                    {sortable ? (
                      <button className="flex items-center gap-1 hover:text-foreground" onClick={() => onSort(colId)}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className={`h-3 w-3 ${sortBy === colId ? 'text-primary' : 'opacity-40'}`} />
                      </button>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id} className="cursor-pointer" onClick={() => navigate(`/contacts/${row.original.id}`)}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
