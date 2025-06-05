
import { PILL_SPECS } from '@/config/pills';
import type { PillSpec, PillCategory } from '@/types';
import { Pill } from './Pill';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const CATEGORY_DISPLAY_NAMES: Record<PillCategory, string> = {
  keyword: 'Keywords',
  function: 'Functions',
  operator: 'Operators',
  condition: 'Conditions & Predicates',
  variable: 'Variables',
  list_value: 'List Values',
};

const CATEGORY_ORDER: PillCategory[] = ['keyword', 'function', 'operator', 'condition', 'variable', 'list_value'];


export function PillPalette() {
  const groupedPills = PILL_SPECS.reduce((acc, pill) => {
    const category = pill.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(pill);
    return acc;
  }, {} as Record<PillCategory, PillSpec[]>);

  const orderedCategories = CATEGORY_ORDER.filter(cat => groupedPills[cat] && groupedPills[cat].length > 0);

  return (
    <Card className="h-full flex flex-col shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Pill Palette</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden p-2">
        <ScrollArea className="h-full pr-2">
          <Accordion type="multiple" defaultValue={orderedCategories} className="w-full">
            {orderedCategories.map((category) => (
              <AccordionItem value={category} key={category}>
                <AccordionTrigger className="text-sm font-semibold hover:no-underline px-2 py-2">
                  {CATEGORY_DISPLAY_NAMES[category] || category.charAt(0).toUpperCase() + category.slice(1)}
                </AccordionTrigger>
                <AccordionContent className="pb-2 pl-2 pr-1 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    {groupedPills[category].map((spec) => (
                      <Pill key={spec.id} pill={spec} isDraggable />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
