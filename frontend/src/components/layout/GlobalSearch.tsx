import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Users, FileText } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';
import { he } from '@/locales/he';
import { formatPhone } from '@/lib/format';
import type { Contact, Quote, Paginated } from '@/types';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 250);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setContacts([]);
      setQuotes([]);
    }
  }, [open]);

  useEffect(() => {
    if (!debounced.trim() || !open) return;
    let active = true;
    void Promise.all([
      api.get<Paginated<Contact>>('/contacts', { params: { search: debounced, pageSize: 6 } }),
      api.get<Paginated<Quote>>('/quotes', { params: { search: debounced, pageSize: 5 } }),
    ]).then(([c, q]) => {
      if (!active) return;
      setContacts(c.data.data);
      setQuotes(q.data.data);
    });
    return () => {
      active = false;
    };
  }, [debounced, open]);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0" hideClose>
        <Command shouldFilter={false} className="overflow-hidden">
          <CommandInput
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder={he.search.hint}
            className="w-full border-b px-4 py-3 text-sm outline-none bg-transparent"
          />
          <CommandList className="max-h-80 overflow-y-auto p-2">
            {!query.trim() && (
              <div className="py-8 text-center text-sm text-muted-foreground">{he.search.hint}</div>
            )}
            {query.trim() && contacts.length === 0 && quotes.length === 0 && (
              <CommandEmpty className="py-8 text-center text-sm text-muted-foreground">
                {he.search.noResults}
              </CommandEmpty>
            )}
            {contacts.length > 0 && (
              <CommandGroup heading={he.search.contacts} className="text-xs text-muted-foreground px-2 py-1">
                {contacts.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`c-${c.id}`}
                    onSelect={() => go(`/contacts/${c.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary data-[selected=true]:bg-secondary"
                  >
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{c.fullName}</span>
                    <span className="text-muted-foreground" dir="ltr">{formatPhone(c.phone)}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {quotes.length > 0 && (
              <CommandGroup heading={he.search.quotes} className="text-xs text-muted-foreground px-2 py-1">
                {quotes.map((q) => (
                  <CommandItem
                    key={q.id}
                    value={`q-${q.id}`}
                    onSelect={() => go(`/quotes/${q.id}`)}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary data-[selected=true]:bg-secondary"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium" dir="ltr">{q.quoteNumber}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
