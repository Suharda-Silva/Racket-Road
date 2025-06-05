
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

      const lineCode = line.map(pill => pill.label).join(' ');

      if (line.length === 1) {
          const pill = line[0];
          if (pill.category === 'variable' || pill.category === 'list_value' ||
             (pill.category === 'keyword' && (pill.label === '#t' || pill.label === '#f'))) { // #t and #f are self-evaluating
              return lineCode;
          }
      }
      
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
                  validSExpr = false; // Multiple top-level s-expressions on one line, not typical for this tool's line-by-line generation
                  break;
              }
          }
          if (balance === 0 && validSExpr) return lineCode;
      }

      // Most constructed lines will need wrapping
      return `(${lineCode})`;
    })
    .filter(lineStr => lineStr.trim() !== '' && lineStr.trim() !== '()')
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
