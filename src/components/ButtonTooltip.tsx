import { useState, ReactNode } from 'react';

interface ButtonTooltipProps {
  content: string;
  children: ReactNode;
  showTooltip: boolean;
}

export function ButtonTooltip({ content, children, showTooltip }: ButtonTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!showTooltip) {
    return <>{children}</>;
  }

  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);
  const handleTouchStart = () => setIsVisible(true);
  const handleTouchEnd = () => {
    setTimeout(() => setIsVisible(false), 2000);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {isVisible && (
        <div className="absolute z-50 w-64 px-3 py-2 text-xs text-white bg-slate-800 rounded-lg shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2 pointer-events-none animate-in fade-in duration-200">
          <div className="relative">
            {content}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-slate-800"
                 style={{ borderLeftWidth: '6px', borderRightWidth: '6px', borderTopWidth: '6px' }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
