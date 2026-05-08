'use client';

/*
  Referral storage helpers.

  When a visitor lands on /?ref=xyz, we persist the code so the
  attribution survives navigation away and back. Two redundant
  stores so both private-mode and cookie-disabled-but-localStorage
  cases are covered:
    1. cookie `furnish_ref`, max-age 30 days, SameSite=Lax
    2. localStorage `furnish_ref` value with timestamp

  Both stores are written/read via the same code/getters so a caller
  doesn't need to know which one served. Reading checks cookie first
  (faster, no localStorage parse), then localStorage as a fallback.
  Writing writes both.

  Code format: 4-16 lowercase alphanumeric characters. Anything else
  is rejected at read time. Defensive against URL pollution.
*/

import { REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_MAX_AGE_DAYS } from '@/lib/referral';

const REFERRAL_CODE_RE = /^[a-z0-9]{4,16}$/;

interface StoredReferral {
  code: string;
  /** ISO timestamp string. Used to age out stale entries from
      localStorage even if the cookie expired. */
  storedAt: string;
}

const MAX_AGE_MS = REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const [k, v] = c.trim().split('=');
    if (k === name && v) return decodeURIComponent(v);
  }
  return null;
}

function writeCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  /* SameSite=Lax: shared with same-site requests, blocked from
     cross-site request submissions. Path=/ so it covers every
     route. Secure on https only. */
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; SameSite=Lax${secure}`;
}

function readLocalStorage(): StoredReferral | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(REFERRAL_COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredReferral>;
    if (typeof parsed.code !== 'string' || typeof parsed.storedAt !== 'string') {
      return null;
    }
    return { code: parsed.code, storedAt: parsed.storedAt };
  } catch {
    return null;
  }
}

function writeLocalStorage(code: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const payload: StoredReferral = {
      code,
      storedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(REFERRAL_COOKIE_NAME, JSON.stringify(payload));
  } catch {
    /* Quota exceeded or storage disabled. Cookie still works. */
  }
}

/**
 * Persist a referral code into both cookie and localStorage with a
 * 30-day expiration.
 */
export function persistReferralCode(rawCode: string): void {
  const code = rawCode.trim().toLowerCase();
  if (!REFERRAL_CODE_RE.test(code)) return;
  writeCookie(REFERRAL_COOKIE_NAME, code, REFERRAL_COOKIE_MAX_AGE_DAYS);
  writeLocalStorage(code);
}

/**
 * Read the persisted referral code. Returns null if missing,
 * malformed, or older than the 30-day window.
 */
export function readReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  const fromCookie = readCookie(REFERRAL_COOKIE_NAME);
  if (fromCookie && REFERRAL_CODE_RE.test(fromCookie)) {
    return fromCookie;
  }

  const stored = readLocalStorage();
  if (stored && REFERRAL_CODE_RE.test(stored.code)) {
    const ageMs = Date.now() - new Date(stored.storedAt).getTime();
    if (ageMs >= 0 && ageMs <= MAX_AGE_MS) {
      return stored.code;
    }
    /* Stale: drop it. */
    try {
      window.localStorage.removeItem(REFERRAL_COOKIE_NAME);
    } catch {
      /* ignore */
    }
  }
  return null;
}
