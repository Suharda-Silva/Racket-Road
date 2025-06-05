
'use client';

import type { PlacedPill, PillSpec, PillCategory } from '@/types';
import { useState, useCallback, useEffect } from 'react';
import { Pill, PillPlaceholder } from './Pill';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles, PlusCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPillCategoryColor } from '@/config/pills';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { checkSyntaxAction } from '@/app/actions/checkSyntaxAction';
import { useToast } from '@/hooks/use-toast';

interface ExpressionDropZoneProps {
  expressionLines: PlacedPill[][];
  onExpressionLinesChange: (lines: PlacedPill[][]) => void;
}

const getNextExpectedCategory = (currentSequence: PlacedPill[]): PillCategory | null => {
  if (currentSequence.length === 0) {
    return 'keyword';
  }

  for (let i = currentSequence.length - 1; i >= 0; i--) {
    const potentialFn = currentSequence[i];
    if ((potentialFn.category === 'function' || potentialFn.category === 'keyword' || potentialFn.category === 'operator') && potentialFn.expects) {
      const argsProvidedCount = currentSequence.length - 1 - i;
      if (argsProvidedCount < potentialFn.expects.length) {
        return potentialFn.expects[argsProvidedCount];
      }
      if (argsProvidedCount >= potentialFn.expects.length) {
        break;
      }
    }
  }
  const lastPill = currentSequence[currentSequence.length - 1];
  if (lastPill.isTerminal) return null;

  return null;
};


export function ExpressionDropZone({ expressionLines, onExpressionLinesChange }: ExpressionDropZoneProps) {
  const [draggedOverLineIndex, setDraggedOverLineIndex] = useState<number | null>(null);
  const [draggedOverPillInfo, setDraggedOverPillInfo] = useState<{lineIndex: number, pillIndex: number} | null>(null);
  const [nextExpectedPerLine, setNextExpectedPerLine] = useState<(PillCategory | null)[]>([]);
  const [errorLineHighlight, setErrorLineHighlight] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setNextExpectedPerLine(expressionLines.map(line => getNextExpectedCategory(line)));
  }, [expressionLines]);

  const resetErrorHighlight = () => {
    if (errorLineHighlight !== null) {
      setErrorLineHighlight(null);
    }
  };

  const handlePlacedPillDragStart = (e: React.DragEvent<HTMLDivElement>, lineIndex: number, pillIndex: number, pillInstanceId: string) => {
    e.dataTransfer.setData('application/racket-placed-pill', JSON.stringify({ lineIndex, pillIndex, instanceId: pillInstanceId }));
    e.dataTransfer.effectAllowed = 'move';
    resetErrorHighlight();
  };

  const handleDropOnLine = useCallback((e: React.DragEvent<HTMLDivElement>, targetLineIdx: number) => {
    e.preventDefault();
    const currentTargetElement = e.currentTarget; // Capture the element
    setDraggedOverLineIndex(null);
    resetErrorHighlight();
    const newLines = [...expressionLines];

    if (e.dataTransfer.types.includes('application/racket-placed-pill')) {
      const { lineIndex: sourceLineIdx, pillIndex: sourcePillIdx, instanceId: draggedInstanceId } = JSON.parse(e.dataTransfer.getData('application/racket-placed-pill'));
      const draggedPill = newLines[sourceLineIdx]?.find(p => p.instanceId === draggedInstanceId);

      if (draggedPill) {
        newLines[sourceLineIdx] = newLines[sourceLineIdx].filter(p => p.instanceId !== draggedInstanceId);
        newLines[targetLineIdx] = [...newLines[targetLineIdx], draggedPill];
        onExpressionLinesChange(newLines);
      }
    } else if (e.dataTransfer.types.includes('application/racket-pill')) {
      const pillSpecJSON = e.dataTransfer.getData('application/racket-pill');
      const pillSpec: PillSpec = JSON.parse(pillSpecJSON);
      const newPlacedPill: PlacedPill = {
        ...pillSpec,
        instanceId: `${pillSpec.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      };
      newLines[targetLineIdx] = [...newLines[targetLineIdx], newPlacedPill];
      onExpressionLinesChange(newLines);
      if (currentTargetElement) {
        currentTargetElement.classList.add('animate-pop');
        setTimeout(() => {
          if (currentTargetElement) {
            currentTargetElement.classList.remove('animate-pop');
          }
        }, 300);
      }
    }
  }, [expressionLines, onExpressionLinesChange]);

  const handleDropOnPill = useCallback((e: React.DragEvent<HTMLDivElement>, targetLineIdx: number, targetPillIdx: number) => {
    e.preventDefault();
    e.stopPropagation(); 
    setDraggedOverPillInfo(null);
    resetErrorHighlight();
    const newLines = [...expressionLines];

    if (e.dataTransfer.types.includes('application/racket-placed-pill')) {
      const { lineIndex: sourceLineIdx, pillIndex: sourcePillIdx, instanceId: draggedInstanceId } = JSON.parse(e.dataTransfer.getData('application/racket-placed-pill'));
      
      if (sourceLineIdx === targetLineIdx && sourcePillIdx === targetPillIdx) return;

      const draggedPill = newLines[sourceLineIdx]?.find(p => p.instanceId === draggedInstanceId);

      if (draggedPill) {
        newLines[sourceLineIdx] = newLines[sourceLineIdx].filter(p => p.instanceId !== draggedInstanceId);
        
        let adjustedTargetPillIdx = targetPillIdx;
        if (sourceLineIdx === targetLineIdx && sourcePillIdx < targetPillIdx) {
          adjustedTargetPillIdx--;
        }

        newLines[targetLineIdx] = [
          ...newLines[targetLineIdx].slice(0, adjustedTargetPillIdx),
          draggedPill,
          ...newLines[targetLineIdx].slice(adjustedTargetPillIdx),
        ];
        onExpressionLinesChange(newLines);
      }
    } else if (e.dataTransfer.types.includes('application/racket-pill')) {
      const pillSpecJSON = e.dataTransfer.getData('application/racket-pill');
      const pillSpec: PillSpec = JSON.parse(pillSpecJSON);
      const newPlacedPill: PlacedPill = {
        ...pillSpec,
        instanceId: `${pillSpec.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      };
      newLines[targetLineIdx] = [
        ...newLines[targetLineIdx].slice(0, targetPillIdx),
        newPlacedPill,
        ...newLines[targetLineIdx].slice(targetPillIdx),
      ];
      onExpressionLinesChange(newLines);
    }
  }, [expressionLines, onExpressionLinesChange]);


  const handleDragOverLine = (e: React.DragEvent<HTMLDivElement>, lineIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverLineIndex(lineIndex);
    setDraggedOverPillInfo(null); 
  };

  const handleDragOverPill = (e: React.DragEvent<HTMLDivElement>, lineIndex: number, pillIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverPillInfo({ lineIndex, pillIndex });
    setDraggedOverLineIndex(lineIndex); 
  };

  const handleDragLeaveLine = () => {
    setDraggedOverLineIndex(null);
  };
  
  const handleDragLeavePill = (e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setDraggedOverPillInfo(null);
  };


  const handleClearExpression = () => {
    onExpressionLinesChange(expressionLines.map(() => []));
    resetErrorHighlight();
  };

  const handleCheckSyntax = async () => {
    const codeToVerify = expressionLines
      .map(line => {
        if (line.length === 0) return '';
        const lineCode = line.map(p => p.label).join(' ');
        if (line.length > 0 && (line[0]?.id === 'define' || (line[0]?.category === 'keyword' && line.length > 1))) {
          return lineCode;
        }
        return `(${lineCode})`;
      })
      .filter(lineStr => lineStr.trim() !== '')
      .join('\n');

    if (!codeToVerify.trim()) {
        toast({ title: "Empty Expression", description: "There's nothing to check.", variant: "default" });
        return;
    }
      
    toast({ title: "Checking Syntax...", description: "Please wait." });
    setErrorLineHighlight(null); 
    try {
      const result = await checkSyntaxAction(codeToVerify);
      if (result.isValid) {
        toast({ title: "Syntax OK!", description: result.message, variant: "default" });
      } else {
        toast({ title: "Syntax Issue", description: result.message, variant: "destructive" });
        if (result.errorLineIndex !== undefined && result.errorLineIndex !== null) {
          setErrorLineHighlight(result.errorLineIndex);
        }
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
    resetErrorHighlight();
  };

  const addLine = () => {
    onExpressionLinesChange([...expressionLines, []]);
    resetErrorHighlight();
  };

  const removeLine = (lineIndex: number) => {
    if (expressionLines.length <= 1) {
      toast({ title: "Cannot Remove", description: "You must have at least one line.", variant: "default" });
      return;
    }
    const newLines = expressionLines.filter((_, idx) => idx !== lineIndex);
    onExpressionLinesChange(newLines);
    resetErrorHighlight();
  };

  return (
    <Card className="h-full flex flex-col shadow-xl">
      <CardHeader className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-lg font-headline">Expression Builder</h2>
          <p className="text-sm text-muted-foreground">Drag pills here to build your Racket expressions.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={addLine} title="Add new line">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Line
        </Button>
      </CardHeader>
      <CardContent className="flex-grow p-6 transition-colors duration-200 ease-in-out flex flex-col space-y-2">
        {expressionLines.map((line, lineIndex) => (
          <div key={`line-${lineIndex}`} className="flex items-center space-x-2 group">
            <div
              className={cn(
                "flex-grow p-2 h-16 border-2 border-dashed rounded-md transition-all duration-200 ease-in-out flex items-center flex-wrap gap-2 overflow-x-auto",
                draggedOverLineIndex === lineIndex && !draggedOverPillInfo ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/70',
                errorLineHighlight === lineIndex && 'border-destructive ring-2 ring-destructive'
              )}
              onDrop={(e) => handleDropOnLine(e, lineIndex)}
              onDragOver={(e) => handleDragOverLine(e, lineIndex)}
              onDragLeave={handleDragLeaveLine}
              aria-label={`Expression line ${lineIndex + 1}`}
            >
              {line.length === 0 && draggedOverLineIndex !== lineIndex && (
                nextExpectedPerLine[lineIndex] ? <PillPlaceholder dotColor={getPillCategoryColor(nextExpectedPerLine[lineIndex])} /> : <div className="text-muted-foreground text-xs pl-1">Drop pills here...</div>
              )}
              {line.map((pill, pillIndex) => (
                <Pill
                  key={pill.instanceId}
                  pill={pill}
                  className={cn(
                    "animate-pop shrink-0",
                    draggedOverPillInfo?.lineIndex === lineIndex && draggedOverPillInfo?.pillIndex === pillIndex && "ring-2 ring-accent"
                  )}
                  onClick={() => removePill(lineIndex, pill.instanceId)}
                  draggable={true}
                  showGrip={false}
                  onDragStart={(e) => handlePlacedPillDragStart(e, lineIndex, pillIndex, pill.instanceId)}
                  onDrop={(e) => handleDropOnPill(e, lineIndex, pillIndex)}
                  onDragOver={(e) => handleDragOverPill(e, lineIndex, pillIndex)}
                  onDragLeave={(e) => handleDragLeavePill(e)}
                  showDot={pillIndex === line.length - 1 && !!nextExpectedPerLine[lineIndex] && !pill.isTerminal}
                  dotColor={getPillCategoryColor(nextExpectedPerLine[lineIndex])}
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeLine(lineIndex)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive",
                expressionLines.length <=1 && "hidden" 
              )}
              title={`Remove line ${lineIndex + 1}`}
            >
              <XCircle className="h-5 w-5" />
            </Button>
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
