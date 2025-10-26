import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const key = `${pathname}${search}`;
  const saveTimer = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          sessionStorage.setItem(`scroll:${key}`, String(window.scrollY || 0));
        } catch {}
      }, 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [key]);

  useEffect(() => {
    const restore = () => {
      try {
        const raw = sessionStorage.getItem(`scroll:${key}`);
        const y = raw ? parseInt(raw, 10) : 0;
        window.scrollTo(0, Number.isNaN(y) ? 0 : y);
      } catch {
        window.scrollTo(0, 0);
      }
    };
    if (navigationType === 'POP') {
      requestAnimationFrame(() => {
        restore();
        setTimeout(restore, 150);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, [key, navigationType]);

  useEffect(() => {
    const onBeforeUnload = () => {
      try {
        sessionStorage.setItem(`scroll:${key}`, String(window.scrollY || 0));
      } catch {}
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [key]);

  return null;
};

export default ScrollToTop;
