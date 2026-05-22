import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';

type ThemeToggleProps = {
  compact?: boolean;
  className?: string;
};

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className={cn('theme-toggle', compact && 'theme-toggle-compact', className)}
      onClick={toggleTheme}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLight ? 'Dark mode' : 'Light mode'}
    >
      {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      {!compact && <span>{isLight ? 'Dark' : 'Light'}</span>}
    </button>
  );
}
