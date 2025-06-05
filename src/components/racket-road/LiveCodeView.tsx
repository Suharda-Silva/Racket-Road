
'use client';

import type { PlacedPill } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveCodeViewProps {
  expressionLines: PlacedPill[][];
}

export function LiveCodeView({ expressionLines }: LiveCodeViewProps) {
  const generateRacketCode = (lines: PlacedPill[][]): string => {
    return lines
      .map(line => {
        if (line.length === 0) {
          return ''; // Skip empty lines
        }
        
        const lineCode = line.map(pill => pill.label).join(' ');

        // Heuristic for outer parentheses:
        // - If it starts with 'define', it's likely a top-level form like (define x 10)
        // - If it starts with a keyword that typically forms a block (like 'list', 'cond', 'lambda' - though we don't have all yet),
        //   and has multiple elements, it's also likely a self-contained S-expression.
        // - Otherwise, wrap it in parentheses.
        const firstPill = line[0];
        if (firstPill?.id === 'define' || 
            (firstPill?.category === 'keyword' && line.length > 1) ) { // e.g. (list 1 2 3)
            return lineCode;
        }
        
        // Avoid wrapping already parenthesized user input, if they typed it like that
        // (This is a basic check and might not cover all cases of user-typed parens)
        if (lineCode.startsWith('(') && lineCode.endsWith(')')) {
            return lineCode;
        }

        return `(${lineCode})`;
      })
      .filter(lineStr => lineStr.trim() !== '' && lineStr.trim() !== '()') // Filter out completely empty or "()" lines
      .join('\n');
  };

  const racketCode = generateRacketCode(expressionLines);

  return (
    <Card className="shadow-xl">
      <CardHeader className="py-4">
        <CardTitle className="font-headline text-lg">Live Racket Code</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <ScrollArea className="h-40 w-full rounded-md border bg-muted/20 p-3 shadow-inner">
          <pre className="text-sm font-code text-foreground whitespace-pre-wrap">
            {racketCode || "// Drag pills to the expression builder above to see code here"}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
