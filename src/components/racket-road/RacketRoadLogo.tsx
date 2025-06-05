import type { SVGProps } from 'react';

export function RacketRoadLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 50"
      width="150"
      height="37.5"
      aria-label="Racket Road Logo"
      {...props}
    >
      <rect width="200" height="50" fill="hsl(var(--background))" />
      <path d="M10 25 C 20 10, 40 10, 50 25 C 60 40, 80 40, 90 25" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" />
      <circle cx="90" cy="25" r="5" fill="hsl(var(--accent))" />
      <text
        x="105"
        y="32"
        fontFamily="Inter, sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="hsl(var(--foreground))"
        className="font-headline"
      >
        Road
      </text>
    </svg>
  );
}
