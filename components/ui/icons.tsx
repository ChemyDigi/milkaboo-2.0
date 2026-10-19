import type { SVGProps } from "react";

/** Custom Halloween icons, drawn on lucide's 24px grid so they sit next to lucide-react icons. */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BatIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 8.5 10.8 6.5 10.6 9C8 7.6 5 7.8 2 9.5c1.6.4 2.6 1.4 3 2.8 1-.8 2.2-.9 3.2-.2.4-1 1.5-1.5 2.4-1.1L12 15l1.4-4c.9-.4 2 .1 2.4 1.1 1-.7 2.2-.6 3.2.2.4-1.4 1.4-2.4 3-2.8-3-1.7-6-1.9-8.6-.5l-.2-2.5Z" />
    </Svg>
  );
}

export function PumpkinIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 6c0-1.6.8-2.8 2.4-3.2" />
      <path d="M12 6.5C9.6 5 4 5.6 4 13s5.6 8 8 6.5c2.4 1.5 8 .5 8-6.5S14.4 5 12 6.5Z" />
      <path d="M12 6.5c-1.4 2-1.4 11 0 13" />
      <path d="m8.5 11 1 1.5h-2Zm7 0 1 1.5h-2ZM8 15.5c1.3 1 2.6 1.4 4 1.4s2.7-.4 4-1.4" />
    </Svg>
  );
}

export function CandleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5c1.5 1.6 1.8 3 .9 4.3a1.1 1.1 0 0 1-1.8 0c-.9-1.3-.6-2.7.9-4.3Z" />
      <path d="M12 9v1" />
      <path d="M8 10h8v10.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1Z" />
      <path d="M8 13c1.2 0 1.2 1.8 2.4 1.8" />
    </Svg>
  );
}

export function BobaPearlIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" fill="currentColor" fillOpacity={0.25} />
      <path d="M8.5 9.5a4 4 0 0 1 3-2.4" />
    </Svg>
  );
}

/** a bubble tea cup with a dome lid and straw */
export function CupIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="m13 2 1.2 6.2" />
      <path d="M5 9.5h14" />
      <path d="M5.5 9.5a6.5 3 0 0 1 13 0" />
      <path d="m6 9.5 1.4 11a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9l1.4-11" />
      <circle cx="10" cy="18" r=".6" fill="currentColor" />
      <circle cx="13.5" cy="17.5" r=".6" fill="currentColor" />
      <circle cx="12" cy="19.4" r=".6" fill="currentColor" />
    </Svg>
  );
}
