'use client';

/*
  Full-screen menu takeover per Document 3 Section 8 plus Document 4
  Section 5.1.

  Five menu items in large display type, sequential reveal animation
  (50ms stagger), body scroll lock, Escape key closes, focus trap
  while open.

  Implementation:
    - Render is always in the DOM (display: none initially) so the
      open animation has stable measurements
    - openMenu() / closeMenu() from @/lib/motion handle the timeline
    - Tab order is constrained inside the menu while open
*/

import * as React from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { openMenu, closeMenu, useReducedMotion } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { track } from '@/lib/analytics';
import { NavCTA } from './NavCTA';

const MENU_LINKS: Array<{ href: string; key: string }> = [
  { href: '/', key: 'linkHome' },
  { href: '/how-it-works', key: 'linkHowItWorks' },
  { href: '/gallery', key: 'linkGallery' },
  { href: '/blog', key: 'linkBlog' },
  { href: '/about', key: 'linkAbout' },
];

export interface MenuTakeoverProps {
  open: boolean;
  onClose: () => void;
}

export function MenuTakeover({ open, onClose }: MenuTakeoverProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const linksRef = React.useRef<HTMLAnchorElement[]>([]);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const prefersReduced = useReducedMotion();

  /* Drive open/close animation when the prop flips. */
  React.useEffect(() => {
    if (!containerRef.current) return;
    const links = linksRef.current.filter(Boolean);

    if (open) {
      openMenu(containerRef.current, links, prefersReduced).then(() => {
        /* Focus the close button after the animation so keyboard
           users land on a sensible target. */
        closeBtnRef.current?.focus();
      });
      track('menu_open');
    } else {
      closeMenu(containerRef.current, prefersReduced);
    }
  }, [open, prefersReduced]);

  /* Escape closes the menu when open. */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* Minimal focus trap. Tab from the last link cycles to the close
     button; Shift-Tab from the close button cycles back. Sufficient
     for this small menu without bringing in a focus-trap library. */
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable: HTMLElement[] = [
        ...linksRef.current.filter(Boolean),
        closeBtnRef.current,
      ].filter((el): el is HTMLElement => el != null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const handleLinkClick = (key: string) => {
    track('menu_link_click', { target: key });
    onClose();
  };

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('nav', 'menuAriaLabel')}
      className={cn(
        'fixed inset-0 z-[9000] hidden',
        'bg-cream',
      )}
      style={{ transform: 'translateY(-100%)' }}
    >
      <div className="flex h-full flex-col px-6 pt-6 pb-12 sm:px-12 sm:pt-10 sm:pb-16">
        <div className="flex items-center justify-between">
          <span
            className="font-display text-display-m text-deep tracking-display-tight"
            aria-hidden="true"
          >
            Furnish
          </span>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t('nav', 'menuClose')}
            className={cn(
              'inline-flex h-12 w-12 items-center justify-center',
              'rounded-full text-deep',
              'btn-secondary-hover',
            )}
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="mt-section-y-tight flex-1">
          <ul className="space-y-3 sm:space-y-5">
            {MENU_LINKS.map((link, idx) => (
              <li key={link.href}>
                <Link
                  ref={(el) => {
                    if (el) linksRef.current[idx] = el;
                  }}
                  href={link.href}
                  onClick={() => handleLinkClick(link.key)}
                  className={cn(
                    'link-underline inline-block',
                    'font-display text-display-m sm:text-display-l',
                    'text-deep',
                    'tracking-display-tight leading-display-tight',
                  )}
                >
                  {t('nav', link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto pt-6">
          <NavCTA location="menu" />
        </div>
      </div>
    </div>
  );
}
