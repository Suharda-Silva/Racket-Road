export type PillCategory = 'function' | 'condition' | 'operator' | 'variable' | 'string' | 'number';

export interface PillSpec {
  id: string; // Unique identifier for the spec, e.g., "filter", "num-1"
  label: string; // Text displayed on the pill, e.g., "filter", "1"
  category: PillCategory; // The type of Racket element it represents
  color: string; // Tailwind CSS background color class, e.g., 'bg-primary'
  textColor: string; // Tailwind CSS text color class, e.g., 'text-primary-foreground'
  // Describes the sequence of argument categories this pill expects if it's a function/operator
  // Example for 'filter': ['condition', 'variable'] (representing (filter <condition> <list-variable>))
  expects?: PillCategory[]; 
  isTerminal?: boolean; // If true, this pill typically doesn't expect anything after it in its own context
}

// Represents a pill that has been placed in the expression builder area
export interface PlacedPill extends PillSpec {
  instanceId: string; // A unique ID for this specific instance of the pill on the canvas
}

// Defines the expected arguments for more complex syntax rules
// This can be used by a helper function to determine the next expected pill type
export interface SyntaxRule {
  [key: string]: PillCategory[]; // e.g., { "filter": ["condition", "variable"], "list": ["number", "string", "variable"] }
}
