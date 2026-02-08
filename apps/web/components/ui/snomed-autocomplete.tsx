'use client';

import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Search } from 'lucide-react';
import { searchSnomedConcepts, type SnomedConcept } from '@/lib/constants/snomed';

interface SnomedAutocompleteProps {
  id: string;
  concepts: SnomedConcept[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

export function SnomedAutocomplete({
  id,
  concepts,
  selectedValues,
  onValuesChange,
  placeholder = 'Type to search...',
  maxSelections,
}: SnomedAutocompleteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredConcepts, setFilteredConcepts] = useState<SnomedConcept[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get selected concepts
  const selectedConcepts = concepts.filter(c => selectedValues.includes(c.id));

  // Filter concepts based on search
  useEffect(() => {
    const results = searchSnomedConcepts(searchQuery, concepts, 15);
    // Exclude already selected
    const filtered = results.filter(c => !selectedValues.includes(c.id));
    setFilteredConcepts(filtered);
  }, [searchQuery, concepts, selectedValues]);

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
    if (maxSelections && selectedValues.length >= maxSelections) {
      return;
    }

    onValuesChange([...selectedValues, concept.id]);
    setSearchQuery('');
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemove = (conceptId: string) => {
    onValuesChange(selectedValues.filter(id => id !== conceptId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev =>
        prev < filteredConcepts.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredConcepts[focusedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected items */}
      {selectedConcepts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedConcepts.map(concept => (
            <Badge
              key={concept.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1"
            >
              <span className="text-xs">{concept.term}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemove(concept.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            ref={inputRef}
            id={id}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
              setFocusedIndex(-1);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10"
            disabled={maxSelections ? selectedValues.length >= maxSelections : false}
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

        {/* No results */}
        {showDropdown && searchQuery && filteredConcepts.length === 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 mt-1 w-full rounded-md border bg-white p-3 shadow-lg"
          >
            <p className="text-sm text-gray-500">
              No matches found for "{searchQuery}"
            </p>
            <p className="text-xs text-gray-400 mt-1">
              You can still type custom entries if needed
            </p>
          </div>
        )}
      </div>

      {/* Max selections hint */}
      {maxSelections && (
        <p className="text-xs text-gray-500">
          {selectedValues.length} / {maxSelections} selected
        </p>
      )}
    </div>
  );
}
