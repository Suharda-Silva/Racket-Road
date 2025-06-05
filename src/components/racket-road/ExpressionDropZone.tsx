
'use client';

import type { PlacedPill, PillSpec, PillCategory } from '@/types';
import { useState, useCallback, useEffect } from 'react';
import { Pill, PillPlaceholder } from './Pill';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPillCategoryColor } from '@/config/pills';
import { Card, CardContent } from '@/components/ui/card';
import { checkSyntaxAction } from '@/app/actions/checkSyntaxAction';
import { useToast } from '@/hooks/use-toast';

// Basic syntax rule helper: determines the next expected category
// This is a simplified version. A more robust solution would involve a proper parser or state machine.
const getNextExpectedCategory = (currentSequence: PlacedPill[]): PillCategory | null => {
  if (currentSequence.length === 0) {
    return 'keyword'; // Allow 'define' or a function to start
  }

  const lastPill = currentSequence[currentSequence.length - 1];
  
  // Simplified: Iteratively find the most recent function/keyword that might still expect arguments.
  // This is a basic heuristic and doesn't fully parse nested structures.
  for (let i = currentSequence.length - 1; i >= 0; i--) {
    const potentialFn = currentSequence[i];
    if ((potentialFn.category === 'function' || potentialFn.category === 'keyword' || potentialFn.category === 'operator') && potentialFn.expects) {
      // Count arguments provided *after* this potentialFn in the sequence up to the end.
      // This simple count assumes arguments are flat and immediately follow.
      const argsProvidedCount = currentSequence.length - 1 - i;
      
      if (argsProvidedCount < potentialFn.expects.length) {
        return potentialFn.expects[argsProvidedCount];
      }
      // If this function's args are filled, it's no longer the "active" one for next expectation.
      // The loop will continue to check earlier functions/keywords.
    }
  }
  
  // If the last pill itself is terminal and no unfulfilled function was found before it.
  if (lastPill.isTerminal) return null; 

  // Default: if no specific function context is found or the last function is satisfied,
  // expect a new top-level expression (e.g., another function or keyword).
  return 'keyword'; 
};


export function ExpressionDropZone() {
  const [expression, setExpression] = useState<PlacedPill[]>([]);
  const [draggedOver, setDraggedOver] = useState(false);
  const [nextExpected, setNextExpected] = useState<PillCategory | null>('keyword');
  const { toast } = useToast();

  useEffect(() => {
    setNextExpected(getNextExpectedCategory(expression));
  }, [expression]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDraggedOver(false);
    const pillSpecJSON = e.dataTransfer.getData('application/racket-pill');
    if (pillSpecJSON) {
      const pillSpec: PillSpec = JSON.parse(pillSpecJSON);
      const newPlacedPill: PlacedPill = {
        ...pillSpec,
        instanceId: `${pillSpec.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      };
      setExpression((prev) => [...prev, newPlacedPill]);
      const dropZoneElement = e.currentTarget;
      dropZoneElement.classList.add('animate-pop');
      setTimeout(() => dropZoneElement.classList.remove('animate-pop'), 300);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
    setDraggedOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedOver(false);
  };

  const handleClearExpression = () => {
    setExpression([]);
  };

  const handleCheckSyntax = async () => {
    const codeToVerify = expression.map(p => p.label).join(' '); 
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
  
  const removePill = (instanceId: string) => {
    setExpression(prev => prev.filter(p => p.instanceId !== instanceId));
  };

  return (
    <Card className="h-full flex flex-col shadow-xl">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-headline">Expression Builder</h2>
        <p className="text-sm text-muted-foreground">Drag pills here to build your Racket expression.</p>
      </div>
      <CardContent
        className={cn(
          "flex-grow p-6 min-h-[200px] transition-colors duration-200 ease-in-out flex items-start", // Added flex items-start
          draggedOver ? 'bg-accent/10' : ''
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="Expression drop zone"
      >
        {expression.length === 0 && !draggedOver && (
           nextExpected ? <PillPlaceholder dotColor={getPillCategoryColor(nextExpected)} /> : <div className="flex items-center justify-center h-full w-full text-muted-foreground">Drop pills here</div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {expression.map((pill, index) => (
            <Pill 
              key={pill.instanceId} 
              pill={pill} 
              className="animate-pop"
              onClick={() => removePill(pill.instanceId)} 
              showDot={index === expression.length -1 && !!nextExpected && !pill.isTerminal}
              dotColor={getPillCategoryColor(nextExpected)}
            />
          ))}
        </div>

      </CardContent>
      <div className="p-4 border-t border-border flex justify-end space-x-2">
        <Button variant="outline" onClick={handleClearExpression} title="Clear expression">
          <Trash2 className="mr-2 h-4 w-4" /> Clear
        </Button>
        <Button onClick={handleCheckSyntax} title="Check Racket syntax">
          <Sparkles className="mr-2 h-4 w-4" /> Check Syntax
        </Button>
      </div>
    </Card>
  );
}
