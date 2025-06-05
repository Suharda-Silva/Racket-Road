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
    return 'function'; // Typically, Racket expressions start with a function
  }

  const lastPill = currentSequence[currentSequence.length - 1];
  
  if (lastPill.expects && lastPill.expects.length > 0) {
    // How many args of lastPill's type have been provided *after* it in the sequence?
    let providedArgsCount = 0;
    let tempSequence = [...currentSequence];
    tempSequence.pop(); // Remove lastPill itself

    // This logic is still too simple, as it doesn't understand nesting or argument boundaries.
    // For now, let's assume 'expects' defines a flat sequence of arguments.
    // A more robust approach would track the "active function" and its filled arguments.
    
    // Simplified: find first pill that looks like it belongs to lastPill
    let i = currentSequence.length - 2;
    while(i >= 0) {
      const prevPill = currentSequence[i];
      // This is a naive check. Does not really understand scope.
      if (lastPill.expects.includes(prevPill.category)) {
         providedArgsCount++;
      } else if (prevPill.category === 'function') { // Stop if we hit another function
        break;
      }
      i--;
    }
    
    // A very basic heuristic for demonstration
    const currentArgIndex = currentSequence.filter(p => p.category !== 'function' && p.category !== 'operator').length % lastPill.expects.length;


    if (currentArgIndex < lastPill.expects.length) {
       return lastPill.expects[currentArgIndex];
    }
  }

  // If the last pill is terminal or its expectations are met,
  // we might expect another function or an operator to continue/combine expressions.
  if (lastPill.isTerminal) return null; // Or 'operator' if we want to chain like (+ 1 2)
  
  // Default fallback, or if previous function's args are filled
  return 'variable'; // Could be more intelligent
};


export function ExpressionDropZone() {
  const [expression, setExpression] = useState<PlacedPill[]>([]);
  const [draggedOver, setDraggedOver] = useState(false);
  const [nextExpected, setNextExpected] = useState<PillCategory | null>('function');
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
      // Trigger a "pop" animation on the drop zone or last pill
      const dropZoneElement = e.currentTarget;
      dropZoneElement.classList.add('animate-pop');
      setTimeout(() => dropZoneElement.classList.remove('animate-pop'), 300);
    }
  }, []);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Necessary to allow dropping
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
    const codeToVerify = expression.map(p => p.label).join(' '); // Simplified representation
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
          "flex-grow p-6  min-h-[200px] transition-colors duration-200 ease-in-out",
          draggedOver ? 'bg-accent/10' : ''
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="Expression drop zone"
      >
        {expression.length === 0 && !draggedOver && (
           <div className="flex items-center justify-center h-full">
             <PillPlaceholder category={nextExpected} dotColor={getPillCategoryColor(nextExpected)} />
           </div>
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
          {expression.length > 0 && nextExpected && !draggedOver && (
             <PillPlaceholder category={nextExpected} dotColor={getPillCategoryColor(nextExpected)} />
          )}
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
