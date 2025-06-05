
import type { PillSpec, PillCategory } from '@/types';

export const PILL_SPECS: PillSpec[] = [
  // Keywords (Grey)
  {
    id: 'define',
    label: 'define',
    category: 'keyword',
    color: 'bg-pill-keyword', // Should be grey
    textColor: 'text-pill-keyword-foreground',
    expects: ['variable', 'list_value']
  },
  {
    id: 'list',
    label: 'list',
    category: 'keyword',
    color: 'bg-pill-keyword', // Should be grey
    textColor: 'text-pill-keyword-foreground',
    expects: ['list_value', 'list_value', 'list_value'] 
  },
  {
    id: 'display',
    label: 'display',
    category: 'keyword',
    color: 'bg-pill-keyword', // Should be grey
    textColor: 'text-pill-keyword-foreground',
    expects: ['list_value']
  },

  // Functions (Purple)
  {
    id: 'cons',
    label: 'cons',
    category: 'function',
    color: 'bg-pill-function',
    textColor: 'text-pill-function-foreground',
    expects: ['list_value', 'variable']
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
    expects: ['function', 'list_value', 'variable']
  },

  // Conditions & Predicates (Blue)
  {
    id: 'empty?',
    label: 'empty?',
    category: 'condition',
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
    expects: ['list_value'],
    isTerminal: false,
  },
  {
    id: 'odd?',
    label: 'odd?',
    category: 'condition',
    color: 'bg-pill-condition',
    textColor: 'text-pill-condition-foreground',
    expects: ['list_value'],
    isTerminal: false,
  },

  // Operators (Blue)
  {
    id: '+',
    label: '+',
    category: 'operator',
    color: 'bg-pill-operator',
    textColor: 'text-pill-operator-foreground',
    expects: ['list_value', 'list_value']
  },
  {
    id: '-',
    label: '-',
    category: 'operator',
    color: 'bg-pill-operator',
    textColor: 'text-pill-operator-foreground',
    expects: ['list_value', 'list_value']
  },
   {
    id: '=',
    label: '=',
    category: 'operator',
    color: 'bg-pill-operator',
    textColor: 'text-pill-operator-foreground',
    expects: ['list_value', 'list_value']
  },

  // Variables (Orange)
  { id: 'item', label: 'item', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'x', label: 'x', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },

  // List Values
  // Numbers (Orange)
  { id: 'num-0', label: '0', category: 'list_value', color: 'bg-pill-number', textColor: 'text-pill-number-foreground', isTerminal: true },
  { id: 'num-1', label: '1', category: 'list_value', color: 'bg-pill-number', textColor: 'text-pill-number-foreground', isTerminal: true },
  { id: 'num-generic', label: '1 2 3', category: 'list_value', color: 'bg-pill-number', textColor: 'text-pill-number-foreground', isTerminal: true },
  { id: 'num-long-sequence', label: '1 2 3 4 5 6 7 8 9', category: 'list_value', color: 'bg-pill-number', textColor: 'text-pill-number-foreground', isTerminal: true },
  // Strings (Green)
  { id: 'str-hello', label: '"hello"', category: 'list_value', color: 'bg-pill-string', textColor: 'text-pill-string-foreground', isTerminal: true },
];

// Helper to get pill color based on category for the dot indicator
export const getPillCategoryColor = (category: PillCategory | null): string => {
  if (!category) return 'bg-muted'; 
  switch (category) {
    case 'keyword': return 'bg-pill-keyword';
    case 'function': return 'bg-pill-function';
    case 'condition': return 'bg-pill-condition';
    case 'operator': return 'bg-pill-operator';
    case 'variable': return 'bg-pill-variable';
    case 'list_value':
      // For the dot, 'list_value' can represent numbers or strings.
      // We'll default to the number color as a general 'value' indicator.
      return 'bg-pill-number'; 
    default: return 'bg-muted opacity-50'; 
  }
};
