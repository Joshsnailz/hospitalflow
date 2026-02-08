'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { searchSnomedConcepts, type SnomedConcept } from '@/lib/constants/snomed';

interface SnomedSingleAutocompleteProps {
  id?: string;
  concepts: SnomedConcept[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SnomedSingleAutocomplete({
  id,
  concepts,
  value,
  onChange,
  placeholder = 'Type to search or enter custom text...',
}: SnomedSingleAutocompleteProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredConcepts, setFilteredConcepts] = useState<SnomedConcept[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter concepts based on search
  useEffect(() => {
    if (value) {
      const results = searchSnomedConcepts(value, concepts, 15);
      setFilteredConcepts(results);
    } else {
      setFilteredConcepts(concepts.slice(0, 15));
    }
  }, [value, concepts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (concept: SnomedConcept) => {
    onChange(concept.term);
    setShowDropdown(false);
    setFocusedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowDropdown(true);
      setFocusedIndex(prev =>
        prev < filteredConcepts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && focusedIndex >= 0 && showDropdown) {
      e.preventDefault();
      handleSelect(filteredConcepts[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
            setFocusedIndex(-1);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && filteredConcepts.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-white shadow-lg"
        >
          {filteredConcepts.map((concept, index) => (
            <button
              key={concept.id}
              type="button"
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                index === focusedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => handleSelect(concept)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">{concept.term}</span>
                <span className="text-xs text-gray-500">{concept.category}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      {showDropdown && value && filteredConcepts.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-white p-3 shadow-lg"
        >
          <p className="text-sm text-gray-500">
            No matches found. You can enter custom text.
          </p>
        </div>
      )}
    </div>
  );
}
