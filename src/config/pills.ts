
import type { PillSpec, PillCategory } from '@/types';

export const PILL_SPECS: PillSpec[] = [
  // Keywords
  { 
    id: 'define', 
    label: 'define', 
    category: 'keyword', 
    color: 'bg-pill-keyword', 
    textColor: 'text-pill-keyword-foreground',
    expects: ['variable', 'variable'] // Simplified: (define varName valueOrExpressionStart)
  },
  { 
    id: 'list', 
    label: 'list', 
    category: 'keyword', // Changed from 'function'
    color: 'bg-pill-keyword', 
    textColor: 'text-pill-keyword-foreground',
    expects: ['variable', 'number', 'string'] // Guides (list item1 item2 item3...)
  },

  // Functions
  { 
    id: 'cons', 
    label: 'cons', 
    category: 'function', 
    color: 'bg-pill-function', 
    textColor: 'text-pill-function-foreground',
    expects: ['variable', 'variable'] 
  },
  { 
    id: 'first', 
    label: 'first', 
    category: 'function', 
    color: 'bg-pill-function', 
    textColor: 'text-pill-function-foreground',
    expects: ['variable'] 
  },
  { 
    id: 'rest', 
    label: 'rest', 
    category: 'function', 
    color: 'bg-pill-function', 
    textColor: 'text-pill-function-foreground',
    expects: ['variable'] 
  },
  { 
    id: 'filter', 
    label: 'filter', 
    category: 'function', 
    color: 'bg-pill-function', 
    textColor: 'text-pill-function-foreground',
    expects: ['condition', 'variable'] 
  },
  { 
    id: 'map', 
    label: 'map', 
    category: 'function', 
    color: 'bg-pill-function', 
    textColor: 'text-pill-function-foreground',
    expects: ['function', 'variable'] 
  },
  { 
    id: 'foldr', 
    label: 'foldr', 
    category: 'function', 
    color: 'bg-pill-function', 
    textColor: 'text-pill-function-foreground',
    expects: ['function', 'variable', 'variable'] 
  },

  // Conditions
  { 
    id: 'empty?', 
    label: 'empty?', 
    category: 'condition', // Changed from 'function'
    color: 'bg-pill-condition', 
    textColor: 'text-pill-condition-foreground',
    expects: ['variable'] 
  },
  { 
    id: 'even?', 
    label: 'even?', 
    category: 'condition', 
    color: 'bg-pill-condition', 
    textColor: 'text-pill-condition-foreground',
    expects: ['number'], 
    isTerminal: false, 
  },
  { 
    id: 'odd?', 
    label: 'odd?', 
    category: 'condition', 
    color: 'bg-pill-condition', 
    textColor: 'text-pill-condition-foreground',
    expects: ['number'],
    isTerminal: false, 
  },

  // Operators
  { 
    id: '+', 
    label: '+', 
    category: 'operator', 
    color: 'bg-pill-operator', 
    textColor: 'text-pill-operator-foreground',
    expects: ['number', 'number'] 
  },
  { 
    id: '-', 
    label: '-', 
    category: 'operator', 
    color: 'bg-pill-operator', 
    textColor: 'text-pill-operator-foreground',
    expects: ['number', 'number'] 
  },
   { 
    id: '=', 
    label: '=', 
    category: 'operator', 
    color: 'bg-pill-operator', 
    textColor: 'text-pill-operator-foreground',
    expects: ['number', 'number'] 
  },

  // Variables
  { id: 'my-list', label: 'my-list', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'item', label: 'item', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'acc', label: 'acc', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'x', label: 'x', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },

  // Strings
  { id: 'str-hello', label: '"hello"', category: 'string', color: 'bg-pill-string', textColor: 'text-pill-string-foreground', isTerminal: true },
  { id: 'str-empty', label: '""', category: 'string', color: 'bg-pill-string', textColor: 'text-pill-string-foreground', isTerminal: true },

  // Numbers
  { id: 'num-generic', label: '123', category: 'number', color: 'bg-pill-number', textColor: 'text-pill-number-foreground', isTerminal: true },
];

// Helper to get pill color based on category for the dot indicator
export const getPillCategoryColor = (category: PillCategory | null): string => {
  if (!category) return 'bg-muted'; // Default dot color if no specific category is expected
  // These directly return Tailwind background color classes
  switch (category) {
    case 'keyword': return 'bg-pill-keyword';
    case 'function': return 'bg-pill-function';
    case 'condition': return 'bg-pill-condition';
    case 'operator': return 'bg-pill-operator';
    case 'variable': return 'bg-pill-variable';
    case 'string': return 'bg-pill-string';
    case 'number': return 'bg-pill-number';
    default: return 'bg-muted opacity-50'; // Fallback for the dot
  }
};
