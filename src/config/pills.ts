import type { PillSpec, PillCategory } from '@/types';

export const PILL_SPECS: PillSpec[] = [
  // Functions
  { 
    id: 'list', 
    label: 'list', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['number', 'string', 'variable'] // A list can take multiple items, this is simplified
  },
  { 
    id: 'cons', 
    label: 'cons', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['variable', 'variable'] // (cons item list) - types are simplified to variable
  },
  { 
    id: 'first', 
    label: 'first', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['variable'] // (first list)
  },
  { 
    id: 'rest', 
    label: 'rest', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['variable'] // (rest list)
  },
  { 
    id: 'empty?', 
    label: 'empty?', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['variable'] // (empty? list)
  },
  { 
    id: 'filter', 
    label: 'filter', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['condition', 'variable'] // (filter pred list)
  },
  { 
    id: 'map', 
    label: 'map', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['function', 'variable'] // (map proc list)
  },
  { 
    id: 'foldr', 
    label: 'foldr', 
    category: 'function', 
    color: 'bg-pill-function-DEFAULT', 
    textColor: 'text-pill-function-foreground',
    expects: ['function', 'variable', 'variable'] // (foldr proc base list)
  },

  // Conditions (can also be functions)
  { 
    id: 'even?', 
    label: 'even?', 
    category: 'condition', 
    color: 'bg-pill-condition-DEFAULT', 
    textColor: 'text-pill-condition-foreground',
    expects: ['number'], // e.g. (even? x)
    isTerminal: false, // when used as a predicate, it's followed by its argument
  },
  { 
    id: 'odd?', 
    label: 'odd?', 
    category: 'condition', 
    color: 'bg-pill-condition-DEFAULT', 
    textColor: 'text-pill-condition-foreground',
    expects: ['number'],
    isTerminal: false, 
  },

  // Operators
  { 
    id: '+', 
    label: '+', 
    category: 'operator', 
    color: 'bg-pill-operator-DEFAULT', 
    textColor: 'text-pill-operator-foreground',
    expects: ['number', 'number'] 
  },
  { 
    id: '-', 
    label: '-', 
    category: 'operator', 
    color: 'bg-pill-operator-DEFAULT', 
    textColor: 'text-pill-operator-foreground',
    expects: ['number', 'number'] 
  },
   { 
    id: '=', 
    label: '=', 
    category: 'operator', 
    color: 'bg-pill-operator-DEFAULT', 
    textColor: 'text-pill-operator-foreground',
    expects: ['number', 'number'] // or other types
  },


  // Variables
  { id: 'my-list', label: 'my-list', category: 'variable', color: 'bg-pill-variable-DEFAULT', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'item', label: 'item', category: 'variable', color: 'bg-pill-variable-DEFAULT', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'acc', label: 'acc', category: 'variable', color: 'bg-pill-variable-DEFAULT', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'x', label: 'x', category: 'variable', color: 'bg-pill-variable-DEFAULT', textColor: 'text-pill-variable-foreground', isTerminal: true },


  // Strings
  { id: 'str-hello', label: '"hello"', category: 'string', color: 'bg-pill-string-DEFAULT', textColor: 'text-pill-string-foreground', isTerminal: true },
  { id: 'str-empty', label: '""', category: 'string', color: 'bg-pill-string-DEFAULT', textColor: 'text-pill-string-foreground', isTerminal: true },

  // Numbers
  { id: 'num-1', label: '1', category: 'number', color: 'bg-pill-number-DEFAULT', textColor: 'text-pill-number-foreground', isTerminal: true },
  { id: 'num-2', label: '2', category: 'number', color: 'bg-pill-number-DEFAULT', textColor: 'text-pill-number-foreground', isTerminal: true },
  { id: 'num-0', label: '0', category: 'number', color: 'bg-pill-number-DEFAULT', textColor: 'text-pill-number-foreground', isTerminal: true },
];

// Helper to get pill color based on category
export const getPillCategoryColor = (category: PillCategory | null): string => {
  if (!category) return 'bg-muted'; // Default placeholder color
  switch (category) {
    case 'function': return 'bg-pill-function-DEFAULT';
    case 'condition': return 'bg-pill-condition-DEFAULT';
    case 'operator': return 'bg-pill-operator-DEFAULT';
    case 'variable': return 'bg-pill-variable-DEFAULT';
    case 'string': return 'bg-pill-string-DEFAULT';
    case 'number': return 'bg-pill-number-DEFAULT';
    default: return 'bg-muted';
  }
};
