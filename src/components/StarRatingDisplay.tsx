import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
  showText?: boolean;
}

export default function StarRatingDisplay({
  rating,
  count,
  size = 14,
  className = '',
  showText = true
}: StarRatingDisplayProps) {
  // Ensure rating is bounded between 0 and 5
  const normalizedRating = Math.max(0, Math.min(5, rating));
  
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating % 1 >= 0.4 && normalizedRating % 1 <= 0.8;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`inline-flex items-center gap-1 font-mono text-xs ${className}`} id="star-rating-display">
      <div className="flex items-center text-amber-500">
        {[...Array(fullStars)].map((_, i) => (
          <Star 
            key={`full-${i}`} 
            style={{ width: size, height: size }} 
            className="fill-current shrink-0" 
          />
        ))}
        {hasHalfStar && (
          <StarHalf 
            style={{ width: size, height: size }} 
            className="fill-current shrink-0 text-amber-500" 
          />
        )}
        {[...Array(Math.max(0, emptyStars))].map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            style={{ width: size, height: size }} 
            className="text-slate-205 text-slate-300 dark:text-slate-700 shrink-0" 
          />
        ))}
      </div>
      
      {showText && (
        <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">
          {normalizedRating.toFixed(1)}
        </span>
      )}
      
      {count !== undefined && (
        <span className="text-slate-400 dark:text-slate-500 font-sans text-[10px] ml-0.5">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
