import { useState, useEffect } from 'react';

export const useSwipe = (itemCount, sensitivity = 50) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const minSwipeDistance = sensitivity;

  const onTouchStart = (e) => {
    setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, itemCount - 1));
    } else if (isRightSwipe) {
      setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    }
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [itemCount]);

  return {
    currentIndex,
    setCurrentIndex,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
