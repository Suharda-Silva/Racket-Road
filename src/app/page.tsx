
'use client';

import type { PlacedPill } from '@/types';
import { useState } from 'react';
import { PillPalette } from '@/components/racket-road/PillPalette';
import { ExpressionDropZone } from '@/components/racket-road/ExpressionDropZone';
import { LiveCodeView } from '@/components/racket-road/LiveCodeView';
import { RacketRoadLogo } from '@/components/racket-road/RacketRoadLogo';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from 'lucide-react';

const INITIAL_LINES = 1; // Start with one line

export default function RacketRoadPage() {
  const [expressionLines, setExpressionLines] = useState<PlacedPill[][]>(() => Array(INITIAL_LINES).fill(null).map(() => []));

  const howToPlayItems = [
    <>Drag pills from the <strong className="text-primary">Pill Palette</strong> on the left.</>,
    <>Drop them into the <strong className="text-accent">Expression Builder</strong> on the right.</>,
    "Pills are color-coded: Purple (functions), Blue (conditions/operators), Orange (variables/numbers), Green (strings), Grey (keywords).",
    "A colored dot or placeholder indicates what type of pill might be expected next.",
    "Click on a pill in the builder to remove it.",
    <>Use the <strong className="text-foreground">Check Syntax</strong> button to get AI feedback (simulated).</>,
    "Use the '+' button in the Expression Builder to add more lines for your code."
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b sticky top-0 bg-background/80 backdrop-blur-md z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RacketRoadLogo />
            <h1 className="text-2xl font-headline font-bold text-primary">Racket Road</h1>
          </div>
          <p className="text-sm text-muted-foreground hidden md:block">Learn Racket lists interactively!</p>
        </div>
      </header>

      <div className="container mx-auto py-4 px-4">
        <Accordion type="single" collapsible className="w-full bg-card shadow-sm rounded-lg border">
          <AccordionItem value="how-to-play" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2 text-base font-semibold text-primary">
                <HelpCircle className="h-5 w-5" />
                <span>How to Play</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground mb-2">Construct Racket list expressions by dragging pills.</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-card-foreground">
                {howToPlayItems.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <main className="flex-grow container mx-auto pt-4 pb-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
            <PillPalette />
          </div>
          <div className="md:col-span-2 h-full flex flex-col gap-6">
            <ExpressionDropZone
              expressionLines={expressionLines}
              onExpressionLinesChange={setExpressionLines}
            />
            <LiveCodeView expressionLines={expressionLines} />
          </div>
        </div>
      </main>

      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Racket Road. Happy Coding!</p>
      </footer>
    </div>
  );
}
