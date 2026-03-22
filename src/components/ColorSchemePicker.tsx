import { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const colorSchemes = [
  {
    id: 'green',
    label: 'Forest',
    preview: 'bg-[hsl(123,46%,33%)]',
    light: {
      '--primary': '123 46% 33%',
      '--ring': '123 46% 33%',
      '--accent': '123 30% 94%',
      '--accent-foreground': '123 46% 28%',
      '--fresh-green': '123 46% 33%',
      '--fresh-green-light': '120 40% 94%',
      '--fresh-green-dark': '123 46% 28%',
      '--success': '123 46% 33%',
      '--sidebar-primary': '123 46% 33%',
      '--sidebar-background': '123 46% 10%',
      '--sidebar-accent': '123 30% 94%',
      '--sidebar-ring': '123 46% 33%',
    },
    dark: {
      '--primary': '123 46% 40%',
      '--ring': '123 46% 40%',
      '--accent': '123 30% 18%',
      '--accent-foreground': '123 46% 55%',
      '--fresh-green': '123 46% 40%',
      '--fresh-green-light': '123 30% 14%',
      '--fresh-green-dark': '123 46% 55%',
      '--success': '123 46% 40%',
      '--sidebar-primary': '123 46% 40%',
      '--sidebar-accent': '123 30% 18%',
      '--sidebar-ring': '123 46% 45%',
    },
  },
  {
    id: 'blue',
    label: 'Ocean',
    preview: 'bg-[hsl(217,91%,50%)]',
    light: {
      '--primary': '217 91% 50%',
      '--ring': '217 91% 50%',
      '--accent': '217 40% 94%',
      '--accent-foreground': '217 91% 40%',
      '--fresh-green': '217 91% 50%',
      '--fresh-green-light': '217 40% 94%',
      '--fresh-green-dark': '217 91% 40%',
      '--success': '217 91% 50%',
      '--sidebar-primary': '217 91% 50%',
      '--sidebar-background': '217 91% 12%',
      '--sidebar-accent': '217 40% 94%',
      '--sidebar-ring': '217 91% 50%',
    },
    dark: {
      '--primary': '217 91% 55%',
      '--ring': '217 91% 55%',
      '--accent': '217 40% 18%',
      '--accent-foreground': '217 91% 65%',
      '--fresh-green': '217 91% 55%',
      '--fresh-green-light': '217 40% 14%',
      '--fresh-green-dark': '217 91% 65%',
      '--success': '217 91% 55%',
      '--sidebar-primary': '217 91% 55%',
      '--sidebar-accent': '217 40% 18%',
      '--sidebar-ring': '217 91% 60%',
    },
  },
  {
    id: 'purple',
    label: 'Berry',
    preview: 'bg-[hsl(270,60%,50%)]',
    light: {
      '--primary': '270 60% 50%',
      '--ring': '270 60% 50%',
      '--accent': '270 40% 94%',
      '--accent-foreground': '270 60% 40%',
      '--fresh-green': '270 60% 50%',
      '--fresh-green-light': '270 40% 94%',
      '--fresh-green-dark': '270 60% 40%',
      '--success': '270 60% 50%',
      '--sidebar-primary': '270 60% 50%',
      '--sidebar-background': '270 60% 12%',
      '--sidebar-accent': '270 40% 94%',
      '--sidebar-ring': '270 60% 50%',
    },
    dark: {
      '--primary': '270 60% 58%',
      '--ring': '270 60% 58%',
      '--accent': '270 40% 18%',
      '--accent-foreground': '270 60% 70%',
      '--fresh-green': '270 60% 58%',
      '--fresh-green-light': '270 40% 14%',
      '--fresh-green-dark': '270 60% 70%',
      '--success': '270 60% 58%',
      '--sidebar-primary': '270 60% 58%',
      '--sidebar-accent': '270 40% 18%',
      '--sidebar-ring': '270 60% 62%',
    },
  },
  {
    id: 'orange',
    label: 'Sunset',
    preview: 'bg-[hsl(25,95%,50%)]',
    light: {
      '--primary': '25 95% 50%',
      '--ring': '25 95% 50%',
      '--accent': '25 50% 94%',
      '--accent-foreground': '25 95% 38%',
      '--fresh-green': '25 95% 50%',
      '--fresh-green-light': '25 50% 94%',
      '--fresh-green-dark': '25 95% 38%',
      '--success': '25 95% 50%',
      '--sidebar-primary': '25 95% 50%',
      '--sidebar-background': '25 95% 12%',
      '--sidebar-accent': '25 50% 94%',
      '--sidebar-ring': '25 95% 50%',
    },
    dark: {
      '--primary': '25 95% 55%',
      '--ring': '25 95% 55%',
      '--accent': '25 50% 18%',
      '--accent-foreground': '25 95% 68%',
      '--fresh-green': '25 95% 55%',
      '--fresh-green-light': '25 50% 14%',
      '--fresh-green-dark': '25 95% 68%',
      '--success': '25 95% 55%',
      '--sidebar-primary': '25 95% 55%',
      '--sidebar-accent': '25 50% 18%',
      '--sidebar-ring': '25 95% 60%',
    },
  },
  {
    id: 'red',
    label: 'Cherry',
    preview: 'bg-[hsl(0,72%,50%)]',
    light: {
      '--primary': '0 72% 50%',
      '--ring': '0 72% 50%',
      '--accent': '0 40% 95%',
      '--accent-foreground': '0 72% 40%',
      '--fresh-green': '0 72% 50%',
      '--fresh-green-light': '0 40% 95%',
      '--fresh-green-dark': '0 72% 40%',
      '--success': '0 72% 50%',
      '--sidebar-primary': '0 72% 50%',
      '--sidebar-background': '0 72% 12%',
      '--sidebar-accent': '0 40% 95%',
      '--sidebar-ring': '0 72% 50%',
    },
    dark: {
      '--primary': '0 72% 55%',
      '--ring': '0 72% 55%',
      '--accent': '0 40% 18%',
      '--accent-foreground': '0 72% 65%',
      '--fresh-green': '0 72% 55%',
      '--fresh-green-light': '0 40% 14%',
      '--fresh-green-dark': '0 72% 65%',
      '--success': '0 72% 55%',
      '--sidebar-primary': '0 72% 55%',
      '--sidebar-accent': '0 40% 18%',
      '--sidebar-ring': '0 72% 60%',
    },
  },
];

function applyScheme(schemeId: string, isDark: boolean) {
  const scheme = colorSchemes.find(s => s.id === schemeId);
  if (!scheme) return;

  const vars = isDark ? scheme.dark : scheme.light;
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function ColorSchemePicker() {
  const [activeScheme, setActiveScheme] = useState(() => {
    return localStorage.getItem('color-scheme') || 'green';
  });

  // Apply on mount and when theme changes
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    applyScheme(activeScheme, isDark);

    // Watch for dark mode changes
    const observer = new MutationObserver(() => {
      const isDarkNow = document.documentElement.classList.contains('dark');
      applyScheme(activeScheme, isDarkNow);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [activeScheme]);

  const handleSelect = (schemeId: string) => {
    setActiveScheme(schemeId);
    localStorage.setItem('color-scheme', schemeId);
    const isDark = document.documentElement.classList.contains('dark');
    applyScheme(schemeId, isDark);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Change color scheme">
          <Palette className="h-5 w-5 text-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="end">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Color Scheme</p>
        <div className="grid grid-cols-5 gap-2">
          {colorSchemes.map((scheme) => (
            <button
              key={scheme.id}
              onClick={() => handleSelect(scheme.id)}
              className="group flex flex-col items-center gap-1.5"
              title={scheme.label}
            >
              <div
                className={`w-9 h-9 rounded-full ${scheme.preview} flex items-center justify-center transition-all ring-2 ring-offset-2 ring-offset-popover ${
                  activeScheme === scheme.id ? 'ring-foreground scale-110' : 'ring-transparent hover:ring-muted-foreground/40'
                }`}
              >
                {activeScheme === scheme.id && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </div>
              <span className={`text-[10px] leading-tight ${activeScheme === scheme.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {scheme.label}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
