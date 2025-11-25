import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

function ExpandableSearchBar({ value, onChange, placeholder = "Search..." }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  useEffect(() => {
    // Auto-expand if there's a value
    if (value && !isExpanded) {
      setIsExpanded(true);
    }
  }, [value]);

  const handleClear = () => {
    onChange('');
    setIsExpanded(false);
  };

  const handleBlur = () => {
    // Only collapse if there's no search value
    if (!value) {
      setIsExpanded(false);
    }
  };

  return (
    <div className="relative">
      {isExpanded ? (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            className="w-96 pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export default ExpandableSearchBar;
