'use client';

/*
  WaitlistContext + provider.

  Centralizes the WaitlistModal at the layout level so every CTA on
  the site, nav pill, mobile menu, hero, gallery, blog, final CTA,
  comparison table, anywhere, opens the same modal via a shared
  `openWaitlist()` call instead of each component owning its own
  modal state or hard-linking to `#waitlist` anchors.

  Usage in any client component:

    const { open } = useWaitlist();
    <button onClick={open}>Join the Waitlist</button>

  The provider is mounted once in app/layout.tsx around the whole
  document so the modal is portal-ready from any page.
*/

import * as React from 'react';
import { WaitlistModal } from './WaitlistModal';

interface WaitlistContextValue {
  /** Opens the waitlist modal. */
  open: () => void;
  /** Closes the modal. Rarely needed, backdrop, Esc, and the
      modal's own close button handle most cases. */
  close: () => void;
  /** Current open state, exposed for components that need to
      reflect it (e.g. aria-expanded on a trigger). */
  isOpen: boolean;
}

const WaitlistContext = React.createContext<WaitlistContextValue | null>(
  null,
);

export interface WaitlistProviderProps {
  children: React.ReactNode;
}

export function WaitlistProvider({ children }: WaitlistProviderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  const value = React.useMemo<WaitlistContextValue>(
    () => ({ open, close, isOpen }),
    [open, close, isOpen],
  );

  return (
    <WaitlistContext.Provider value={value}>
      {children}
      <WaitlistModal open={isOpen} onClose={close} />
    </WaitlistContext.Provider>
  );
}

/** Hook to read the waitlist controller. Throws (in dev) if used
    outside the provider, otherwise returns no-op fallbacks so SSR
    doesn't crash on a stray client-only consumer. */
export function useWaitlist(): WaitlistContextValue {
  const ctx = React.useContext(WaitlistContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(
        'useWaitlist used outside <WaitlistProvider>. Wrap the app layout.',
      );
    }
    return { open: () => {}, close: () => {}, isOpen: false };
  }
  return ctx;
}
