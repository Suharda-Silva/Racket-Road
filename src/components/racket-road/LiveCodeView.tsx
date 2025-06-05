
'use client';

import type { PlacedPill } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface LiveCodeViewProps {
  expressionLines: PlacedPill[][];
  evaluationResult: string | null;
}

export const generateRacketCode = (lines: PlacedPill[][]): string => {
  return lines
    .map(line => {
      if (line.length === 0) {
        return '';
      }

      // Case 1: Single pill on the line
      if (line.length === 1) {
        const pill = line[0];
        // Check if it's a self-evaluating atom or a variable name that doesn't need wrapping.
        if (pill.category === 'variable' || 
            pill.category === 'list_value' || 
            (pill.category === 'keyword' && (pill.label === '#t' || pill.label === '#f'))) {
          return pill.label;
        }
        // Otherwise, a single function/operator/keyword pill (like 'list' by itself) should be wrapped if it's meant to be called.
        return `(${pill.label})`;
      }

      // Case 2: Multiple pills on the line, forming an S-expression.
      const firstPill = line[0];

      // Handle (define var (list elements...)) specifically
      if (firstPill.label === 'define' && line.length >= 3 && line[2].label === 'list') {
        const varName = line[1].label;
        const listKeyword = line[2].label;
        const listElements = line.slice(3).map(p => p.label).join(' ');
        const listExpr = `(${listKeyword}${listElements ? ' ' + listElements : ''})`;
        return `(${firstPill.label} ${varName} ${listExpr})`;
      }
      
      // Handle (define var <value_expression>) or (define var <simple_value>)
      if (firstPill.label === 'define' && line.length >= 2) { // Need at least define and var
        const varName = line[1].label;
        if (line.length === 2) { // (define x) - incomplete, but represent as is for syntax checker
             return `(${firstPill.label} ${varName})`;
        }
        const valuePills = line.slice(2);
        if (valuePills.length === 1) { 
          // (define x 10) or (define x "foo") or (define x someVar)
          return `(${firstPill.label} ${varName} ${valuePills[0].label})`;
        } else { 
          // (define x (+ 1 2))
          const valueExpr = `(${valuePills.map(p => p.label).join(' ')})`;
          return `(${firstPill.label} ${varName} ${valueExpr})`;
        }
      }

      // Default case for other S-expressions (filter even? x), (+ 1 2), etc.
      const allLabels = line.map(pill => pill.label).join(' ');
      return `(${allLabels})`;
    })
    .filter(lineStr => lineStr.trim() !== '') // Remove empty lines
    //.filter(lineStr => lineStr.trim() !== '()') // Allow empty list () if generated intentionally
    .join('\n');
};

export function LiveCodeView({ expressionLines, evaluationResult }: LiveCodeViewProps) {
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
        {evaluationResult !== null && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Evaluation Result (Simulated):</h3>
              <div className="rounded-md border bg-muted/20 p-3 shadow-inner">
                <pre className="text-sm font-code text-foreground whitespace-pre-wrap">
                  {evaluationResult}
                </pre>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
