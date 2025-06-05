import { PillPalette } from '@/components/racket-road/PillPalette';
import { ExpressionDropZone } from '@/components/racket-road/ExpressionDropZone';
import { RacketRoadLogo } from '@/components/racket-road/RacketRoadLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RacketRoadPage() {
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

      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full md:min-h-[calc(100vh-200px)]">
          <div className="md:col-span-1 h-full min-h-[300px] md:min-h-0">
            <PillPalette />
          </div>
          <div className="md:col-span-2 h-full min-h-[400px] md:min-h-0">
            <ExpressionDropZone />
          </div>
        </div>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="font-headline">How to Play</CardTitle>
            <CardDescription>Construct Racket list expressions by dragging pills.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Drag pills from the <strong className="text-primary">Pill Palette</strong> on the left.</li>
              <li>Drop them into the <strong className="text-accent">Expression Builder</strong> on the right.</li>
              <li>Pills are color-coded: Purple (functions), Blue (conditions/operators), Orange (variables/numbers), Green (strings).</li>
              <li>A colored dot or placeholder indicates what type of pill might be expected next.</li>
              <li>Click on a pill in the builder to remove it.</li>
              <li>Use the <strong className="text-foreground">Check Syntax</strong> button to get AI feedback (simulated).</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 border-t text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Racket Road. Happy Coding!</p>
      </footer>
    </div>
  );
}
