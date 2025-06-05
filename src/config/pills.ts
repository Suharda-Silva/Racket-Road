
import type { PillSpec, PillCategory } from '@/types';

export const PILL_SPECS: PillSpec[] = [
  // Keywords
  {
    id: 'define',
    label: 'define',
    category: 'keyword',
    color: 'bg-pill-keyword',
    textColor: 'text-pill-keyword-foreground',
    expects: ['variable', 'list_value'] // (define varName valueOrExpressionStart) - value can be a number, string, or start of another expr.
  },
  {
    id: 'list',
    label: 'list',
    category: 'keyword',
    color: 'bg-pill-keyword',
    textColor: 'text-pill-keyword-foreground',
    expects: ['list_value', 'list_value', 'list_value']
  },

  // Functions
  {
    id: 'cons',
    label: 'cons',
    category: 'function',
    color: 'bg-pill-function',
    textColor: 'text-pill-function-foreground',
    expects: ['list_value', 'variable'] // (cons item list-var)
  },
  {
    id: 'first',
    label: 'first',
    category: 'function',
    color: 'bg-pill-function',
    textColor: 'text-pill-function-foreground',
    expects: ['variable'] // (first list-var)
  },
  {
    id: 'rest',
    label: 'rest',
    category: 'function',
    color: 'bg-pill-function',
    textColor: 'text-pill-function-foreground',
    expects: ['variable'] // (rest list-var)
  },
  {
    id: 'filter',
    label: 'filter',
    category: 'function',
    color: 'bg-pill-function',
    textColor: 'text-pill-function-foreground',
    expects: ['condition', 'variable'] // (filter predicate-fn list-var)
  },
  {
    id: 'map',
    label: 'map',
    category: 'function',
    color: 'bg-pill-function',
    textColor: 'text-pill-function-foreground',
    expects: ['function', 'variable'] // (map transform-fn list-var)
  },
  {
    id: 'foldr',
    label: 'foldr',
    category: 'function',
    color: 'bg-pill-function',
    textColor: 'text-pill-function-foreground',
    expects: ['function', 'list_value', 'variable'] // (foldr combiner initial-value list-var)
  },

  // Conditions
  {
    id: 'empty?',
    label: 'empty?',
    category: 'condition',
    color: 'bg-pill-condition',
    textColor: 'text-pill-condition-foreground',
    expects: ['variable'] // (empty? list-var)
  },
  {
    id: 'even?',
    label: 'even?',
    category: 'condition',
    color: 'bg-pill-condition',
    textColor: 'text-pill-condition-foreground',
    expects: ['list_value'], // (even? number-value)
    isTerminal: false,
  },
  {
    id: 'odd?',
    label: 'odd?',
    category: 'condition',
    color: 'bg-pill-condition',
    textColor: 'text-pill-condition-foreground',
    expects: ['list_value'], // (odd? number-value)
    isTerminal: false,
  },

  // Operators
  {
    id: '+',
    label: '+',
    category: 'operator',
    color: 'bg-pill-operator',
    textColor: 'text-pill-operator-foreground',
    expects: ['list_value', 'list_value'] // (+ num1 num2 ...)
  },
  {
    id: '-',
    label: '-',
    category: 'operator',
    color: 'bg-pill-operator',
    textColor: 'text-pill-operator-foreground',
    expects: ['list_value', 'list_value'] // (- num1 num2 ...)
  },
   {
    id: '=',
    label: '=',
    category: 'operator',
    color: 'bg-pill-operator',
    textColor: 'text-pill-operator-foreground',
    expects: ['list_value', 'list_value'] // (= val1 val2)
  },

  // Variables
  { id: 'item', label: 'item', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'x', label: 'x', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'input-list', label: 'input-list', category: 'variable', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },


  // List Values (Numbers and Strings)
  { id: 'str-hello', label: '"hello"', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'num-generic', label: '1 2 3', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'num-single-1', label: '1', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
  { id: 'num-single-0', label: '0', category: 'list_value', color: 'bg-pill-variable', textColor: 'text-pill-variable-foreground', isTerminal: true },
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
    case 'list_value': return 'bg-pill-variable'; // Using orange for list values
    default: return 'bg-muted opacity-50'; // Fallback for the dot
  }
};
