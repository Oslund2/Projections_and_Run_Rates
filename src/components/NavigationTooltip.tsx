import { useState, ReactNode } from 'react';

interface NavigationTooltipProps {
  content: string;
  children: ReactNode;
}

export function NavigationTooltip({ content, children }: NavigationTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-[60] px-3 py-2 text-xs text-white bg-slate-800 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none whitespace-nowrap animate-in fade-in duration-200">
          <div className="relative">
            {content}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-800"
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
