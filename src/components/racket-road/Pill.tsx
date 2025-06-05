'use client';

import type { PillSpec, PillCategory } from '@/types';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface PillProps {
  pill: PillSpec;
  isDraggable?: boolean;
  showDot?: boolean;
  dotColor?: string; // Tailwind bg color class for the dot
  onClick?: () => void;
  className?: string;
  isGhost?: boolean; // For displaying in drop zone not yet filled
}

export function Pill({
  pill,
  isDraggable = false,
  showDot = false,
  dotColor = 'bg-accent',
  onClick,
  className,
  isGhost = false,
}: PillProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isDraggable) return;
    e.dataTransfer.setData('application/racket-pill', JSON.stringify(pill));
    e.dataTransfer.effectAllowed = 'move';
  };

  const baseClasses = "flex items-center justify-between px-4 py-2 rounded-full shadow-md transition-all duration-150 ease-in-out";
  const interactiveClasses = isDraggable ? "cursor-grab active:cursor-grabbing hover:shadow-lg" : (onClick ? "cursor-pointer hover:shadow-lg" : "");
  const ghostClasses = isGhost ? "border-2 border-dashed opacity-70" : pill.color;
  
  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        baseClasses,
        pill.textColor,
        interactiveClasses,
        ghostClasses,
        className
      )}
      aria-label={`${pill.label} pill, type ${pill.category}`}
    >
      {isDraggable && <GripVertical className="w-4 h-4 mr-2 opacity-50" />}
      <span className="font-medium select-none">{pill.label}</span>
      {showDot && !isGhost && (
        <span className={cn('w-3 h-3 rounded-full ml-2 shrink-0', dotColor)} aria-label="Next element indicator"></span>
      )}
    </div>
  );
}

export function PillPlaceholder({ category, dotColor }: { category?: PillCategory | null, dotColor?: string }) {
  const label = category ? `${category}` : 'Drop Here';
  return (
    <div 
      className={cn(
        "flex items-center justify-center px-4 py-2 rounded-full shadow-inner border-2 border-dashed text-sm",
        dotColor ? `${dotColor} opacity-50 text-white` : "border-muted text-muted-foreground opacity-70",
        "min-w-[80px]"
      )}
    >
      <span>{label}</span>
    </div>
  );
}
