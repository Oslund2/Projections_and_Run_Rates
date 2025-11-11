import { useEffect, useState } from 'react';
import { Quote } from 'lucide-react';
import { quoteService, type AIQuote } from '../services/quoteService';

interface QuoteFooterProps {
  rotationInterval?: number;
  className?: string;
  tvMode?: boolean;
}

export function QuoteFooter({
  rotationInterval = 8000,
  className = '',
  tvMode = false
}: QuoteFooterProps) {
  const [currentQuote, setCurrentQuote] = useState<AIQuote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);

  const loadNewQuote = async () => {
    setFadeIn(false);

    setTimeout(async () => {
      const quote = await quoteService.getRandomQuote();
      if (quote) {
        setCurrentQuote(quote);
        setIsLoading(false);
        setTimeout(() => setFadeIn(true), 50);
      }
    }, 300);
  };

  useEffect(() => {
    loadNewQuote();

    const interval = setInterval(() => {
      loadNewQuote();
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [rotationInterval]);

  if (isLoading || !currentQuote) {
    return null;
  }

  if (tvMode) {
    return (
      <div className={`w-full py-6 px-8 bg-white/5 backdrop-blur-sm border-t border-white/10 ${className}`}>
        <div
          className={`flex items-start space-x-4 justify-center transition-opacity duration-300 ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Quote className="w-8 h-8 text-blue-300 flex-shrink-0 mt-1" />
          <p className="text-2xl text-blue-100 italic leading-relaxed max-w-5xl">
            {currentQuote.quote_text}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full mt-8 sm:mt-12 py-4 sm:py-6 px-4 sm:px-8 bg-slate-50 border-t border-slate-200 ${className}`}>
      <div
        className={`flex items-start space-x-3 sm:space-x-4 max-w-5xl mx-auto transition-opacity duration-300 ${
          fadeIn ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0 mt-1" />
        <p className="text-sm sm:text-base text-slate-600 italic leading-relaxed">
          {currentQuote.quote_text}
        </p>
      </div>
    </div>
  );
}
