import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  className?: string;
}

export function Tooltip({ content, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className={`text-slate-400 hover:text-slate-600 transition-colors ${className}`}
        aria-label="More information"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {isVisible && (
        <div className="absolute z-50 w-64 p-3 text-sm text-white bg-slate-900 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none">
          <div className="relative">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-slate-900"></div>
          </div>
        </div>
      )}
    </div>
  );
}
