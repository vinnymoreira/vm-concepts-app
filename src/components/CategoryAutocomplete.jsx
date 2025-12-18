import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

function CategoryAutocomplete({
  value,
  onChange,
  categories,
  placeholder = 'Select or type to search...',
  className = '',
  error = false,
  onCreateCategory = null // Optional callback to create new category
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get display value (show selected category or search term)
  const displayValue = isOpen ? searchTerm : (value || '');

  // Filter categories based on search term
  const filteredCategories = categories.filter(cat =>
    cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if we should show "Create new" option
  const showCreateOption = onCreateCategory &&
    searchTerm.trim().length > 0 &&
    !categories.some(cat => cat.toLowerCase() === searchTerm.toLowerCase());

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setSearchTerm('');
  };

  const handleSelectCategory = (category) => {
    onChange(category);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleCreateCategory = async () => {
    if (!onCreateCategory || !searchTerm.trim()) return;

    const newCategory = searchTerm.trim();
    await onCreateCategory(newCategory);
    onChange(newCategory);
    setSearchTerm('');
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    const totalOptions = filteredCategories.length + (showCreateOption ? 1 : 0);

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < totalOptions - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredCategories.length) {
          handleSelectCategory(filteredCategories[highlightedIndex]);
        } else if (highlightedIndex === filteredCategories.length && showCreateOption) {
          handleCreateCategory();
        } else if (filteredCategories.length === 1) {
          handleSelectCategory(filteredCategories[0]);
        } else if (showCreateOption && filteredCategories.length === 0) {
          handleCreateCategory();
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;

      default:
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedElement = dropdownRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [highlightedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100 ${
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } ${className}`}
          autoComplete="off"
        />
        <ChevronDown
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredCategories.length === 0 && !showCreateOption ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No categories found
            </div>
          ) : (
            <>
              {filteredCategories.map((category, index) => (
                <div
                  key={category}
                  onClick={() => handleSelectCategory(category)}
                  className={`px-3 py-2 cursor-pointer text-sm transition-colors ${
                    index === highlightedIndex
                      ? 'bg-indigo-500 text-white'
                      : value === category
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </div>
              ))}
              {showCreateOption && (
                <div
                  onClick={handleCreateCategory}
                  className={`px-3 py-2 cursor-pointer text-sm transition-colors flex items-center gap-2 ${
                    highlightedIndex === filteredCategories.length
                      ? 'bg-indigo-500 text-white'
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                  } ${filteredCategories.length > 0 ? 'border-t border-gray-200 dark:border-gray-600' : ''}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create "{searchTerm}"</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryAutocomplete;
