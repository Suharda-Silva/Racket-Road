import { PILL_SPECS } from '@/config/pills';
import { Pill } from './Pill';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function PillPalette() {
  return (
    <Card className="h-full flex flex-col shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Pill Palette</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-2">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-3">
            {PILL_SPECS.map((spec) => (
              <Pill key={spec.id} pill={spec} isDraggable />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
