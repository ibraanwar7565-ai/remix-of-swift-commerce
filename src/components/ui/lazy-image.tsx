import { useState, useRef, useEffect, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Show a shimmer/blur placeholder while loading */
  placeholderClass?: string;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderClass,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // start loading 200px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {/* Shimmer placeholder */}
      <div
        className={cn(
          'absolute inset-0 bg-muted animate-pulse transition-opacity duration-500',
          loaded ? 'opacity-0' : 'opacity-100',
          placeholderClass
        )}
      />

      {/* Actual image - only loads when in viewport */}
      {inView && src && (
        <img
          src={src}
          alt={alt || ''}
          onLoad={() => setLoaded(true)}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
}
