'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface ComboboxItem {
  value: string;
  label: string;
  category?: string;
}

interface ComboboxProps {
  value: string;
  onChange: (value: string) => void;
  items: ComboboxItem[];
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * Searchable combobox that filters a static list as you type.
 * Always allows free-text entry — selecting an item just fills the input.
 * Items are grouped by their `category` field when present.
 */
export function Combobox({ value, onChange, items, placeholder, className, id }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 1
    ? items.filter((item) => item.label.toLowerCase().includes(value.toLowerCase())).slice(0, 20)
    : items.slice(0, 20);

  // Group by category
  const grouped = filtered.reduce<Record<string, ComboboxItem[]>>((acc, item) => {
    const cat = item.category ?? 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const hasGroups = Object.keys(grouped).length > 0;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && hasGroups && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-64 overflow-auto">
          {Object.entries(grouped).map(([category, groupItems]) => (
            <div key={category}>
              <div className="sticky top-0 px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/80">
                {category}
              </div>
              {groupItems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    'w-full text-left px-3 py-1.5 text-sm hover:bg-accent cursor-pointer',
                    value === item.value && 'bg-accent',
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
