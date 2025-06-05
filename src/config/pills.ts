
import type { PillSpec, PillCategory } from '@/types';

export const PILL_SPECS: PillSpec[] = [
  // Keywords
  {
    id: 'define',
    label: 'define',
    category: 'keyword',
    color: 'bg-pill-keyword',
    textColor: 'text-pill-keyword-foreground',
    expects: ['variable', 'list_value']
  },
  {
    id: 'list',
    label: 'list',
    category: 'keyword',
    color: 'bg-pill-keyword',
    textColor: 'text-pill-keyword-foreground',
    expects: ['list_value', 'list_value', 'list_value']
  },
  {
    id: 'display',
    label: 'display',
    category: 'keyword',
    color: 'bg-pill-keyword',
    textColor: 'text-pill-keyword-foreground',
    expects: ['list_value'] // Assuming display takes one argument
  },

  // Functions
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

  // Conditions
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

  // Operators
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

  // Variables
  { id: 'item', label: 'item', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'x', label: 'x', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },

  // List Values
  { id: 'num-0', label: '0', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'num-1', label: '1', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'str-hello', label: '"hello"', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'num-generic', label: '1 2 3', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'num-long-sequence', label: '1 2 3 4 5 6 7 8 9', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
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
    case 'list_value': return 'bg-pill-variable';
    default: return 'bg-muted opacity-50'; // Fallback for the dot
  }
};

