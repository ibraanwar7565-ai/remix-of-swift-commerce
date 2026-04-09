import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  placeholderClass?: string;
  /** If true, load immediately without waiting for viewport */
  eager?: boolean;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderClass,
  eager = false,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(eager);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eager) return;
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '600px' } // preload 600px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  // Preconnect hint for supabase storage
  const imgSrc = inView ? src : undefined;

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {!loaded && (
        <div
          className={cn(
            'absolute inset-0 bg-muted/40',
            placeholderClass
          )}
        />
      )}

      {imgSrc && (
        <img
          src={imgSrc}
          alt={alt || ''}
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          decoding="async"
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
}