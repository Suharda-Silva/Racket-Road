
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
        // A simple heuristic: if the first pill is 'define' or another keyword that starts a top-level form,
        // it might not need outer parens for that line itself.
        // Other expressions (function calls, operations) usually are wrapped.
        const lineCode = line.map(pill => pill.label).join(' ');
        if (line[0]?.id === 'define' || (line[0]?.category === 'keyword' && line.length > 1) ) {
            return lineCode;
        }
        return `(${lineCode})`;
      })
      .filter(lineStr => lineStr.trim() !== '')
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
