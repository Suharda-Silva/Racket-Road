
'use client';

import type { PlacedPill } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveCodeViewProps {
  expressionLines: PlacedPill[][];
}

export const generateRacketCode = (lines: PlacedPill[][]): string => {
  return lines
    .map(line => {
      if (line.length === 0) {
        return '';
      }

      const lineCode = line.map(pill => pill.label).join(' ');

      // If it's a single pill that's a variable, a number, or a string literal.
      // These are considered "atoms" and don't need outer parentheses.
      if (line.length === 1) {
          const pill = line[0];
          if (pill.category === 'variable' ||
              (pill.category === 'list_value' &&
               (/^\d+(\s\d+)*$/.test(pill.label) || /^".*"$/.test(pill.label) || pill.label === '#t' || pill.label === '#f'))) {
              return lineCode;
          }
      }

      // If the user has already typed something that looks like a fully formed S-expression
      if (lineCode.startsWith('(') && lineCode.endsWith(')')) {
          let balance = 0;
          let validSExpr = true;
          for (let i = 0; i < lineCode.length; i++) {
              if (lineCode[i] === '(') balance++;
              else if (lineCode[i] === ')') balance--;
              if (balance < 0) {
                  validSExpr = false;
                  break;
              }
              if (balance === 0 && i < lineCode.length - 1 && lineCode.substring(i+1).trim() !== "") {
                  validSExpr = false;
                  break;
              }
          }
          if (balance === 0 && validSExpr) return lineCode;
      }

      // Default: wrap with parentheses to form an S-expression.
      // This includes `define` forms, e.g., (define x 10)
      // but also simple function calls (which might be what users build initially)
      if (line.length > 0 && (line[0]?.id === 'define' || (line[0]?.category === 'keyword' && line.length > 1) || line[0]?.category === 'function' || line[0]?.category === 'operator' || line[0]?.category === 'condition')) {
         return `(${lineCode})`;
      }
      // If it's not a known form that starts an s-expression, and not an atom, it might be malformed or an incomplete list
      // For now, we'll wrap it to be cautious, but the syntax checker should catch issues.
      return `(${lineCode})`;
    })
    .filter(lineStr => lineStr.trim() !== '' && lineStr.trim() !== '()')
    .join('\n');
};

export function LiveCodeView({ expressionLines }: LiveCodeViewProps) {
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
