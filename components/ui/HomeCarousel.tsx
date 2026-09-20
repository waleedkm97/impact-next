'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

type ItemsPerView = {
  mobile: number;
  tablet: number;
  desktop: number;
};

type HomeCarouselProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T, index: number) => string;
  itemsPerView?: ItemsPerView;
  ariaLabel: string;
};

export default function HomeCarousel<T>({
  items,
  renderItem,
  keyExtractor,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 4 },
  ariaLabel,
}: HomeCarouselProps<T>) {
  const [perView, setPerView] = useState(itemsPerView.desktop);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 640px)');
    const tablet = window.matchMedia('(max-width: 1024px)');

    const update = () => {
      if (mobile.matches) {
        setPerView(itemsPerView.mobile);
      } else if (tablet.matches) {
        setPerView(itemsPerView.tablet);
      } else {
        setPerView(itemsPerView.desktop);
      }
    };

    update();
    mobile.addEventListener('change', update);
    tablet.addEventListener('change', update);

    return () => {
      mobile.removeEventListener('change', update);
      tablet.removeEventListener('change', update);
    };
  }, [itemsPerView.mobile, itemsPerView.tablet, itemsPerView.desktop]);

  const pageCount = Math.max(1, Math.ceil(items.length / perView));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  if (!items.length) return null;

  const canPrev = page > 0;
  const canNext = page < pageCount - 1;
  const startIndex = page * perView;
  const visibleItems = items.slice(startIndex, startIndex + perView);

  const trackStyle: CSSProperties = {
    '--per-view': perView,
  } as CSSProperties;

  return (
    <div className="home-carousel" aria-label={ariaLabel}>
      <div className="home-carousel-viewport">
        <div className="home-carousel-track" style={trackStyle}>
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;

            return (
              <div
                className="home-carousel-item"
                key={keyExtractor(item, actualIndex)}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>

      {items.length > perView && (
        <>
          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow-prev"
            onClick={() => setPage((current) => Math.max(current - 1, 0))}
            disabled={!canPrev}
            aria-label="السابق"
          >
            ›
          </button>

          <button
            type="button"
            className="home-carousel-arrow home-carousel-arrow-next"
            onClick={() =>
              setPage((current) => Math.min(current + 1, pageCount - 1))
            }
            disabled={!canNext}
            aria-label="التالي"
          >
            ‹
          </button>
        </>
      )}
    </div>
  );
}
