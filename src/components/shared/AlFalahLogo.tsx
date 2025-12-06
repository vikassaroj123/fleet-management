import { cn } from '@/lib/utils';

interface AlFalahLogoProps {
  className?: string;
  collapsed?: boolean;
}

export function AlFalahLogo({ className, collapsed = false }: AlFalahLogoProps) {
  if (collapsed) {
    // Collapsed version - just the 'A' with swoosh
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <svg
          width="40"
          height="40"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10"
        >
          {/* Flag gradient bar */}
          <rect x="8" y="105" width="32" height="5" fill="url(#flagGradient)" rx="1" />
          
          {/* Grey swoosh with gradient */}
          <path
            d="M 25 95 Q 35 55, 55 45 Q 75 35, 95 40 L 105 45"
            stroke="url(#swooshGradientCollapsed)"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.85"
          />
          
          {/* Red 'A' */}
          <path
            d="M 35 85 L 25 50 L 35 50 L 45 72 L 55 50 L 65 50 L 55 85 Z M 40 68 L 45 58 L 50 68 Z"
            fill="#DC2626"
            fillRule="evenodd"
          />
          
          <defs>
            <linearGradient id="flagGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id="swooshGradientCollapsed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CA3AF" />
              <stop offset="50%" stopColor="#E5E7EB" />
              <stop offset="100%" stopColor="#6B7280" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  // Full version with text
  return (
    <div className={cn("flex items-center gap-2 md:gap-3", className)}>
      <div className="flex-shrink-0">
        <svg
          width="60"
          height="60"
          viewBox="0 0 200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
        >
          {/* Flag gradient bar */}
          <rect x="12" y="105" width="52" height="7" fill="url(#flagGradientFull)" rx="1.5" />
          
          {/* Grey swoosh with gradient - more pronounced curve */}
          <path
            d="M 35 95 Q 55 45, 85 35 Q 115 25, 145 30 L 165 35"
            stroke="url(#swooshGradient)"
            strokeWidth="4.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.9"
          />
          
          {/* Red 'A' - bolder and more prominent */}
          <path
            d="M 50 90 L 35 40 L 55 40 L 65 75 L 75 40 L 95 40 L 80 90 Z M 60 65 L 65 55 L 70 65 Z"
            fill="#DC2626"
            fillRule="evenodd"
          />
          
          <defs>
            <linearGradient id="flagGradientFull" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <linearGradient id="swooshGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9CA3AF" />
              <stop offset="50%" stopColor="#E5E7EB" />
              <stop offset="100%" stopColor="#6B7280" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      <div className="flex flex-col flex-shrink-0 min-w-0">
        {/* Arabic text */}
        <div className="text-[9px] sm:text-[10px] md:text-xs font-bold text-sidebar-foreground leading-tight mb-0.5">
          الفلاح
        </div>
        {/* English text */}
        <div className="text-xs sm:text-sm md:text-base font-bold text-sidebar-foreground leading-tight">
          AL FALAH
        </div>
        {/* Tagline */}
        <div className="text-[7px] sm:text-[8px] md:text-[10px] text-sidebar-muted italic leading-tight mt-0.5 hidden sm:block">
          Way to Success...
        </div>
      </div>
    </div>
  );
}

