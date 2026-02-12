'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from '@/components/ui/command';
import { useDebounce } from '@/hooks/use-debounce';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface ComboboxProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options?: ComboboxOption[];
  onSearch?: (term: string) => Promise<ComboboxOption[]>;
  allowFreeText?: boolean;
  placeholder?: string;
  disabled?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Combobox({
  value,
  onValueChange,
  options: staticOptions,
  onSearch,
  allowFreeText = false,
  placeholder = 'Select...',
  disabled = false,
  emptyMessage = 'No results found.',
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [asyncOptions, setAsyncOptions] = React.useState<ComboboxOption[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const isAsync = !!onSearch;
  const debouncedInput = useDebounce(inputValue, 300);

  // Run async search when debounced input changes
  React.useEffect(() => {
    if (!isAsync || !open) return;
    if (debouncedInput.length < 2) {
      setAsyncOptions([]);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    onSearch!(debouncedInput).then((results) => {
      if (!cancelled) {
        setAsyncOptions(results);
        setIsSearching(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setAsyncOptions([]);
        setIsSearching(false);
      }
    });

    return () => { cancelled = true; };
  }, [debouncedInput, isAsync, open]);

  const displayOptions = isAsync ? asyncOptions : staticOptions || [];

  // Find the label for current value
  const selectedLabel = React.useMemo(() => {
    if (!value) return '';
    const found = displayOptions.find(
      (opt) => opt.value.toLowerCase() === value.toLowerCase()
    );
    if (found) return found.label;
    // For static options, check the original list too
    if (staticOptions) {
      const staticFound = staticOptions.find(
        (opt) => opt.value.toLowerCase() === value.toLowerCase()
      );
      if (staticFound) return staticFound.label;
    }
    return value; // Show raw value if no match (edit mode with pre-populated data)
  }, [value, displayOptions, staticOptions]);

  const handleSelect = (selectedValue: string) => {
    onValueChange(selectedValue === value ? '' : selectedValue);
    setOpen(false);
    setInputValue('');
  };

  const handleInputChange = (search: string) => {
    setInputValue(search);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      // On close: if allowFreeText and user typed something, use it
      if (allowFreeText && inputValue.trim() && !value) {
        onValueChange(inputValue.trim());
      }
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allowFreeText && inputValue.trim()) {
      // Check if there's a matching option
      const match = displayOptions.find(
        (opt) => opt.label.toLowerCase() === inputValue.toLowerCase()
      );
      if (match) {
        onValueChange(match.value);
      } else {
        onValueChange(inputValue.trim());
      }
      setOpen(false);
      setInputValue('');
      e.preventDefault();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-10 w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {value ? selectedLabel : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command shouldFilter={!isAsync} onKeyDown={handleKeyDown}>
          <CommandInput
            placeholder={isAsync ? 'Type to search...' : 'Search...'}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isSearching && (
              <CommandLoading>
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              </CommandLoading>
            )}
            {!isSearching && displayOptions.length === 0 && inputValue.length >= (isAsync ? 2 : 0) && (
              <CommandEmpty>
                {isAsync && inputValue.length < 2
                  ? 'Type at least 2 characters...'
                  : emptyMessage}
              </CommandEmpty>
            )}
            {displayOptions.length > 0 && (
              <CommandGroup>
                {displayOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value?.toLowerCase() === option.value.toLowerCase()
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      {option.description && (
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
