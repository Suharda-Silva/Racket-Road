
'use client';

import type { PlacedPill, PillSpec, PillCategory } from '@/types';
import { useState, useCallback, useEffect } from 'react';
import { Pill, PillPlaceholder } from './Pill';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPillCategoryColor } from '@/config/pills';
import { Card, CardContent } from '@/components/ui/card';
import { checkSyntaxAction } from '@/app/actions/checkSyntaxAction';
import { useToast } from '@/hooks/use-toast';

interface ExpressionDropZoneProps {
  expressionLines: PlacedPill[][];
  onExpressionLinesChange: (lines: PlacedPill[][]) => void;
}

const getNextExpectedCategory = (currentSequence: PlacedPill[]): PillCategory | null => {
  if (currentSequence.length === 0) {
    return 'keyword'; // Expect a keyword like 'define' or a function to start an S-expression
  }
  const lastPill = currentSequence[currentSequence.length - 1];

  // Traverse backwards to find the most recent function/operator/keyword that expects arguments
  for (let i = currentSequence.length - 1; i >= 0; i--) {
    const potentialFn = currentSequence[i];
    if ((potentialFn.category === 'function' || potentialFn.category === 'keyword' || potentialFn.category === 'operator') && potentialFn.expects) {
      const argsProvidedCount = currentSequence.length - 1 - i;
      if (argsProvidedCount < potentialFn.expects.length) {
        return potentialFn.expects[argsProvidedCount];
      }
      // If all expected args for this function are provided, it might be the end, or it's nested.
      // For simplicity here, if all args are met, we assume it could be followed by another keyword/fn for a new top-level expression,
      // or it's terminal if the function itself is terminal.
      if (argsProvidedCount >= potentialFn.expects.length) {
        break; // Stop looking further back for this line
      }
    }
  }
  // If the last pill is terminal (like a number or variable not part of a function call yet),
  // then nothing is expected *after* it in its current context.
  // The expression might be complete, or it needs to be part of a larger S-expression.
  if (lastPill.isTerminal) return null;

  // Default fallback if no specific function is guiding, or if a function's args are filled
  // This could mean we are ready for a new top-level expression or the expression is done.
  // Returning null indicates no specific next pill is strictly expected by current syntax.
  return null;
};


export function ExpressionDropZone({ expressionLines, onExpressionLinesChange }: ExpressionDropZoneProps) {
  const [draggedOverLineIndex, setDraggedOverLineIndex] = useState<number | null>(null);
  const [nextExpectedPerLine, setNextExpectedPerLine] = useState<(PillCategory | null)[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setNextExpectedPerLine(expressionLines.map(line => getNextExpectedCategory(line)));
  }, [expressionLines]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, lineIndex: number) => {
    e.preventDefault();
    setDraggedOverLineIndex(null);
    const pillSpecJSON = e.dataTransfer.getData('application/racket-pill');
    if (pillSpecJSON) {
      const pillSpec: PillSpec = JSON.parse(pillSpecJSON);
      const newPlacedPill: PlacedPill = {
        ...pillSpec,
        instanceId: `${pillSpec.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      };
      const newLines = expressionLines.map((line, idx) =>
        idx === lineIndex ? [...line, newPlacedPill] : line
      );
      onExpressionLinesChange(newLines);
      
      const dropZoneElement = e.currentTarget;
      dropZoneElement.classList.add('animate-pop');
      setTimeout(() => dropZoneElement.classList.remove('animate-pop'), 300);
    }
  }, [expressionLines, onExpressionLinesChange]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, lineIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverLineIndex(lineIndex);
  };

  const handleDragLeave = () => {
    setDraggedOverLineIndex(null);
  };

  const handleClearExpression = () => {
    onExpressionLinesChange(expressionLines.map(() => []));
  };

  const handleCheckSyntax = async () => {
    const codeToVerify = expressionLines
      .map(line => {
        if (line.length === 0) return '';
        const lineCode = line.map(p => p.label).join(' ');
        // Heuristic: if not 'define', wrap in parens for syntax check
        return (line[0]?.id === 'define' || line[0]?.category === 'keyword' && line.length > 1) ? lineCode : `(${lineCode})`;
      })
      .filter(lineStr => lineStr.trim() !== '')
      .join('\n');

    if (!codeToVerify.trim()) {
        toast({ title: "Empty Expression", description: "There's nothing to check.", variant: "default" });
        return;
    }
      
    toast({ title: "Checking Syntax...", description: "Please wait." });
    try {
      const result = await checkSyntaxAction(codeToVerify);
      if (result.isValid) {
        toast({ title: "Syntax OK!", description: result.message, variant: "default" });
      } else {
        toast({ title: "Syntax Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not check syntax.", variant: "destructive" });
    }
  };

  const removePill = (lineIndex: number, instanceId: string) => {
    const newLines = expressionLines.map((line, idx) =>
      idx === lineIndex ? line.filter(p => p.instanceId !== instanceId) : line
    );
    onExpressionLinesChange(newLines);
  };

  const addLine = () => {
    onExpressionLinesChange([...expressionLines, []]);
  };

  return (
    <Card className="h-full flex flex-col shadow-xl">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-lg font-headline">Expression Builder</h2>
          <p className="text-sm text-muted-foreground">Drag pills here to build your Racket expressions.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={addLine} title="Add new line">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Line
        </Button>
      </div>
      <CardContent className="flex-grow p-6 min-h-[200px] transition-colors duration-200 ease-in-out flex flex-col space-y-2">
        {expressionLines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className={cn(
              "p-2 h-14 border-2 border-dashed rounded-md transition-colors duration-200 ease-in-out flex items-center flex-wrap gap-2 overflow-x-auto",
              draggedOverLineIndex === lineIndex ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/70'
            )}
            onDrop={(e) => handleDrop(e, lineIndex)}
            onDragOver={(e) => handleDragOver(e, lineIndex)}
            onDragLeave={handleDragLeave}
            aria-label={`Expression line ${lineIndex + 1}`}
          >
            {line.length === 0 && draggedOverLineIndex !== lineIndex && (
              nextExpectedPerLine[lineIndex] ? <PillPlaceholder dotColor={getPillCategoryColor(nextExpectedPerLine[lineIndex])} /> : <div className="text-muted-foreground text-xs pl-1">Drop pills here...</div>
            )}
            {line.map((pill, pillIndex) => (
              <Pill
                key={pill.instanceId}
                pill={pill}
                className="animate-pop shrink-0"
                onClick={() => removePill(lineIndex, pill.instanceId)}
                showDot={pillIndex === line.length - 1 && !!nextExpectedPerLine[lineIndex] && !pill.isTerminal}
                dotColor={getPillCategoryColor(nextExpectedPerLine[lineIndex])}
              />
            ))}
          </div>
        ))}
      </CardContent>
      <div className="p-4 border-t border-border flex justify-end space-x-2">
        <Button variant="outline" onClick={handleClearExpression} title="Clear all expressions">
          <Trash2 className="mr-2 h-4 w-4" /> Clear All
        </Button>
        <Button onClick={handleCheckSyntax} title="Check Racket syntax for all lines">
          <Sparkles className="mr-2 h-4 w-4" /> Check Syntax
        </Button>
      </div>
    </Card>
  );
}
