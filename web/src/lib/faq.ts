/*
  FAQ data layer per Document 8 §3 and §8.

  Single source of truth at src/content/faq/questions.json. The JSON
  is statically imported (no fs reads) so the data is available to
  both server and client components without lifecycle juggling.

  Helpers:
    getAllFAQ()        Returns the full categorized question set.
    getFAQByPage(p)    Returns the flat list of questions whose
                       showOnPages array includes p. Used by
                       /how-it-works mini-FAQ and any future
                       inline embedding.

  The showOnPages field is the contract that lets pages reuse FAQ
  content without duplicating it in component code.
*/

import faqData from '@/content/faq/questions.json';

export interface FAQQuestion {
  id: string;
  question: string;
  answer: string;
  showOnPages: string[];
}

export interface FAQCategory {
  id: string;
  name: string;
  /** Lucide icon name as a string. Components map to the icon. */
  icon: string;
  questions: FAQQuestion[];
}

export interface FAQData {
  categories: FAQCategory[];
}

const data = faqData as FAQData;

export function getAllFAQ(): FAQCategory[] {
  return data.categories;
}

export function getFlatFAQ(): FAQQuestion[] {
  return data.categories.flatMap((c) => c.questions);
}

export function getFAQByPage(pagePath: string): FAQQuestion[] {
  return getFlatFAQ().filter((q) => q.showOnPages.includes(pagePath));
}

export function getFAQCount(): number {
  return getFlatFAQ().length;
}

export function getFAQCategoryCount(): number {
  return data.categories.length;
}
