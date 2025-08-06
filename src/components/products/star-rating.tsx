
'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({ 
  rating = 0, 
  size = 16, 
  className, 
  interactive = false,
  onRatingChange 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const handleStarClick = (rate: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(rate);
    }
  };

  const handleStarHover = (rate: number) => {
    if (interactive) {
      setHoverRating(rate);
    }
  };

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1;
    const isFilled = starValue <= (hoverRating || rating);
    const isHalf = starValue - 0.5 <= (hoverRating || rating) && starValue > (hoverRating || rating);

    return (
      <div 
        key={i} 
        className={cn("relative", interactive && "cursor-pointer")}
        onClick={() => handleStarClick(starValue)}
        onMouseEnter={() => handleStarHover(starValue)}
        onMouseLeave={() => handleStarHover(0)}
      >
        <Star
          size={size}
          className={cn('text-muted-foreground/50', isFilled && 'text-yellow-400')}
          fill={isFilled ? 'currentColor' : 'transparent'}
        />
        {isHalf && !isFilled && (
          <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
             <Star size={size} className="text-yellow-400" fill="currentColor"/>
          </div>
        )}
      </div>
    );
  });

  return <div className={cn('flex items-center gap-0.5', className)}>{stars}</div>;
}
