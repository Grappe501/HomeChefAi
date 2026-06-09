interface SousChefMarkProps {
  name?: string;
  showRole?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

/** Subtle copper mark — accent only, not a mascot. */
export default function SousChefMark({
  name = 'Clara',
  showRole = true,
  size = 'md',
  className = '',
}: SousChefMarkProps) {
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className={`flex items-center gap-2.5 min-h-[52px] ${className}`}>
      <span
        className={`shrink-0 rounded-full bg-copper-500 ${dotSize}`}
        aria-hidden
      />
      <span className={`font-semibold text-chef leading-tight ${textSize}`}>
        {showRole ? (
          <>
            <span className="text-chef-subtle font-medium">Sous Chef </span>
            {name}
          </>
        ) : (
          name
        )}
      </span>
    </div>
  );
}
