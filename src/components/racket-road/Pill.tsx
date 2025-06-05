
'use client';

import type { PillSpec } from '@/types';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface PillProps {
  pill: PillSpec;
  showDot?: boolean;
  dotColor?: string; 
  onClick?: () => void;
  className?: string;
  isGhost?: boolean; 
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
  showGrip?: boolean;
}

export function Pill({
  pill,
  showDot = false,
  dotColor = 'bg-accent',
  onClick,
  className,
  isGhost = false,
  draggable,
  onDragStart,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
  showGrip = false,
}: PillProps) {
  const baseClasses = "flex items-center justify-between px-4 py-2 rounded-full shadow-md transition-all duration-150 ease-in-out";
  const interactiveClasses = draggable ? "cursor-grab active:cursor-grabbing hover:shadow-lg" : (onClick ? "cursor-pointer hover:shadow-lg" : "");
  // The background color is applied here using pill.color.
  // If isGhost is true, different styling is applied.
  const backgroundOrGhostClasses = isGhost ? "border-2 border-dashed opacity-70 border-muted-foreground" : pill.color;
  
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onClick={onClick}
      className={cn(
        baseClasses,
        pill.textColor, // Applies text color, e.g., text-pill-function-foreground
        interactiveClasses,
        backgroundOrGhostClasses, // Applies background color, e.g., bg-pill-function or ghost styles
        className
      )}
      aria-label={`${pill.label} pill, type ${pill.category}`}
    >
      {showGrip && <GripVertical className="w-4 h-4 mr-2 opacity-50" />}
      <span className="font-medium select-none">{pill.label}</span>
      {showDot && !isGhost && (
        <span className={cn('w-3 h-3 rounded-full ml-2 shrink-0', dotColor)} aria-label="Next element indicator"></span>
      )}
    </div>
  );
}

export function PillPlaceholder({ dotColor }: { dotColor?: string }) {
  return (
    <div className="flex items-center justify-center h-full w-full" aria-hidden="true">
      <span
        className={cn(
          'w-3 h-3 rounded-full', 
          dotColor || 'bg-muted opacity-50',
          'shadow-sm'
        )}
      ></span>
    </div>
  );
}
