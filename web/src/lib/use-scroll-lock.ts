'use client';

/*
  useScrollLock — iOS-safe body scroll lock.

  When isLocked flips true, the body is fixed at its current
  scroll position so background content cannot scroll while a
  modal/overlay is open. When isLocked flips false (or the
  component unmounts), the body styles are restored and the
  visible scroll position snaps back to where it was.

  Why position:fixed instead of the naive overflow:hidden:
  iOS Safari ignores body { overflow: hidden } for touch
  scrolling. The page still pans behind the modal. Setting
  position:fixed + saving scrollY + restoring on unlock is the
  only reliable pattern across browsers.

  Usage:
    function MyModal({ open }: { open: boolean }) {
      useScrollLock(open);
      return open ? <div>...</div> : null;
    }
*/

import * as React from 'react';

export function useScrollLock(isLocked: boolean): void {
  React.useEffect(() => {
    if (!isLocked) return;
    if (typeof document === 'undefined') return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.width = '100%';
    return () => {
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
