
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

      if (line.length === 1) {
        const pill = line[0];
        if (pill.category === 'variable' ||
            pill.category === 'list_value' ||
            (pill.category === 'keyword' && (pill.label === '#t' || pill.label === '#f'))) {
          return pill.label;
        }
        return `(${pill.label})`;
      }

      const firstPill = line[0];
      if (firstPill.label === 'define' && line.length >= 2) {
        const varName = line[1].label;
        if (line.length === 2) {
             return `(${firstPill.label} ${varName})`;
        }
        const valuePills = line.slice(2);
        if (valuePills.length === 1) {
          return `(${firstPill.label} ${varName} ${valuePills[0].label})`;
        } else {
          const valueExpr = `(${valuePills.map(p => p.label).join(' ')})`;
          return `(${firstPill.label} ${varName} ${valueExpr})`;
        }
      }

      const allLabels = line.map(pill => pill.label).join(' ');
      return `(${allLabels})`;
    })
    .filter(lineStr => lineStr.trim() !== '')
    .join('\n');
};

export function LiveCodeView({ expressionLines, evaluationResult }: LiveCodeViewProps) {
  const racketCode = generateRacketCode(expressionLines);

  return (
    <Card className="shadow-xl">
      <CardHeader className="p-4 border-b">
        <CardTitle className="font-headline text-lg">Live Racket Code</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-4"> {/* Adjusted padding for consistency */}
        <ScrollArea className="h-40 w-full rounded-md border bg-muted/20 p-3 shadow-inner">
          <pre className="text-sm font-code text-foreground whitespace-pre-wrap">
            {racketCode || "// Drag pills to the expression builder above to see code here"}
          </pre>
        </ScrollArea>
        {evaluationResult !== null && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">Evaluation Result:</h3>
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
