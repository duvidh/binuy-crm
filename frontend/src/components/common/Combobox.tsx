import { useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from 'cmdk';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  options: string[];
  value?: string | null;
  onChange: (value: string) => void;
  onAddNew?: (value: string) => Promise<void> | void;
  placeholder?: string;
  addNewLabel?: string;
  allowClear?: boolean;
}

// Searchable select with an inline "+ add new" action when no match is found.
export function Combobox({
  options,
  value,
  onChange,
  onAddNew,
  placeholder = 'בחר...',
  addNewLabel = '+ הוסף',
  allowClear,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const showAdd = onAddNew && query.trim() && !options.some((o) => o === query.trim());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          className="w-full justify-between font-normal"
        >
          <span className={cn(!value && 'text-muted-foreground')}>{value || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" dir="rtl">
        <Command className="overflow-hidden rounded-md" shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="חיפוש..."
            className="w-full border-b px-3 py-2 text-sm outline-none bg-transparent"
          />
          <CommandList className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 && !showAdd && (
              <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                לא נמצא
              </CommandEmpty>
            )}
            {allowClear && value && (
              <CommandItem
                onSelect={() => {
                  onChange('');
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary"
              >
                ניקוי בחירה
              </CommandItem>
            )}
            <CommandGroup>
              {filtered.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm hover:bg-secondary data-[selected=true]:bg-secondary"
                >
                  {option}
                  {value === option && <Check className="h-4 w-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
            {showAdd && (
              <CommandItem
                value={`__add__${query}`}
                onSelect={async () => {
                  const v = query.trim();
                  await onAddNew?.(v);
                  onChange(v);
                  setQuery('');
                  setOpen(false);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-secondary"
              >
                <Plus className="h-4 w-4" />
                {addNewLabel} "{query.trim()}"
              </CommandItem>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
