import React, { useEffect, useState, useRef } from 'react';
import { Banner, StoreSettings } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSliderProps {
  banners: Banner[];
  settings?: StoreSettings;
  accentColor?: string;
}

export const BannerSlider: React.FC<BannerSliderProps> = ({
  banners = [],
  settings,
  accentColor = '#FF5722',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const bannerCount = banners?.length || 0;

  useEffect(() => {
    if (bannerCount <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerCount);
    }, 4500);
    return () => clearInterval(interval);
  }, [bannerCount]);

  if (!banners || bannerCount === 0) {
    return null;
  }

  // Determine size classes or custom style
  const bannerSize = settings?.bannerSize || 'standard';
  const bannerFit = settings?.bannerFit || 'cover';
  const bannerRadius = settings?.bannerRadius || '2xl';

  // Radius map
  const radiusClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-3xl',
  }[bannerRadius] || 'rounded-2xl';

  // Height presets
  const sizeClasses = {
    compact: 'h-[130px] sm:h-[180px] md:h-[220px] lg:h-[250px]',
    standard: 'h-[160px] sm:h-[220px] md:h-[300px] lg:h-[360px]',
    large: 'h-[200px] sm:h-[280px] md:h-[380px] lg:h-[440px]',
    hero: 'h-[240px] sm:h-[340px] md:h-[450px] lg:h-[520px]',
    custom: '',
  }[bannerSize] || 'h-[160px] sm:h-[220px] md:h-[300px] lg:h-[360px]';

  // Fit style
  const fitClass = bannerFit === 'contain' ? 'bg-contain bg-no-repeat' : bannerFit === 'fill' ? 'bg-fill' : 'bg-cover';

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartXRef.current || !touchEndXRef.current) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    if (diff > 50) {
      setCurrentSlide((prev) => (prev + 1) % (bannerCount || 1));
    } else if (diff < -50) {
      setCurrentSlide((prev) => (prev - 1 + (bannerCount || 1)) % (bannerCount || 1));
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + (bannerCount || 1)) % (bannerCount || 1));
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % (bannerCount || 1));
  };

  const customDesktopHeight = settings?.bannerCustomHeight || 300;
  const customMobileHeight = settings?.bannerCustomHeightMobile || 170;

  return (
    <div
      id="banner-slider-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full ${sizeClasses} ${radiusClasses} overflow-hidden shadow-md mb-6 bg-slate-900 group select-none transition-all duration-300`}
      style={
        bannerSize === 'custom'
          ? {
              minHeight: `${customMobileHeight}px`,
              height: `${customDesktopHeight}px`,
            }
          : undefined
      }
    >
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 w-full h-full ${fitClass} bg-center transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
          style={{ backgroundImage: `url('${banner.img}')` }}
        >
          {banner.title && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 sm:p-6 text-white flex items-end">
              <span className="text-sm sm:text-lg md:text-xl font-semibold drop-shadow-md">
                {banner.title}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Desktop Prev/Next Navigation Controls */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous banner"
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg hover:scale-105"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next banner"
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white items-center justify-center backdrop-blur-xs transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg hover:scale-105"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Slide Indicator Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 sm:bottom-3.5 left-0 right-0 z-20 flex justify-center items-center gap-1.5 sm:gap-2">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentSlide ? 'w-6 sm:w-8' : 'w-2 sm:w-2.5 bg-white/60 hover:bg-white'
              }`}
              style={{
                backgroundColor: idx === currentSlide ? accentColor : undefined,
              }}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
