
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
        // (e.g. '(1 2 3) or (begin ...))
        // This is a basic check and might not cover all complex user inputs perfectly.
        if (lineCode.startsWith('(') && lineCode.endsWith(')')) {
            let balance = 0;
            let validSExpr = true;
            for (let i = 0; i < lineCode.length; i++) {
                if (lineCode[i] === '(') balance++;
                else if (lineCode[i] === ')') balance--;
                if (balance < 0) { // Closing paren before matching open
                    validSExpr = false;
                    break;
                }
                if (balance === 0 && i < lineCode.length - 1 && lineCode.substring(i+1).trim() !== "") { // e.g. (foo) (bar)
                    validSExpr = false; 
                    break;
                }
            }
            if (balance === 0 && validSExpr) return lineCode;
        }
        
        // Default: wrap with parentheses to form an S-expression.
        // This includes `define` forms, e.g., (define x 10)
        return `(${lineCode})`;
      })
      .filter(lineStr => lineStr.trim() !== '' && lineStr.trim() !== '()') 
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
