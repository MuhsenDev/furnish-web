'use client';

/*
  Shared wrapper that handles the modal-vs-link branching used by
  MegaNavFeaturedTile + MegaNavAppGrid. Both surfaces have the
  same logic: if the href is the WAITLIST_MODAL_HREF sentinel,
  render a <button> that opens the WaitlistModal; otherwise
  render a Next <Link>. Before this wrapper existed the branch +
  the useWaitlist() hookup + the WAITLIST_MODAL_HREF import lived
  in both leaf components.

  Caller passes:
    - href: the destination string (or the sentinel)
    - onActivate: callback fired before navigation / modal open.
      Typically tracks analytics + closes the overlay.
    - className: passed to the rendered button/Link
    - children: the card's inner JSX (image + copy)

  Order of operations on click:
    1. onActivate()  (analytics + overlay close)
    2. openWaitlist() if href is the sentinel
    3. Otherwise Link's default navigation happens
*/

import * as React from 'react';
import Link from 'next/link';
import { useWaitlist } from '@/components/shared/WaitlistContext';
import { WAITLIST_MODAL_HREF } from '@/data/nav-mega';

export interface MegaNavActionWrapperProps {
  href: string;
  /** Fired before navigation / modal open. */
  onActivate: () => void;
  className?: string;
  children: React.ReactNode;
}

export function MegaNavActionWrapper({
  href,
  onActivate,
  className,
  children,
}: MegaNavActionWrapperProps) {
  const { open: openWaitlist } = useWaitlist();
  const isModal = href === WAITLIST_MODAL_HREF;

  const handleClick = () => {
    onActivate();
    if (isModal) openWaitlist();
  };

  if (isModal) {
    return (
      <button type="button" onClick={handleClick} className={className}>
        {children}
      </button>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
