/*
  Shared template for /privacy and /terms per Document 8 §4 and §5.

  Renders the markdown content from src/content/legal/<slug>.md
  through a narrow-container layout with consistent typography.

  Template only. The actual legal text comes from Termly or
  iubenda; Hassan pastes the generated content into the markdown
  files. The rendering pipeline reuses next-mdx-remote (already
  installed in Phase 7) so headings, lists, and links render with
  the brand prose styles defined in the blog MDX component map.
*/

import * as React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Container } from '@/components/Container';
import { blogMdxComponents } from '@/components/blog/mdx-components';
import { cn } from '@/lib/utils';
import { t, formatDate } from '@/lib/i18n';

const LEGAL_DIR = path.join(process.cwd(), 'src', 'content', 'legal');

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  body: string;
}

export function loadLegalDocument(slug: 'privacy' | 'terms'): LegalDocument | null {
  const fullPath = path.join(LEGAL_DIR, `${slug}.md`);
  if (!fs.existsSync(fullPath)) return null;
  const raw = fs.readFileSync(fullPath, 'utf-8');
  const { data, content } = matter(raw);
  return {
    title: (data.title as string) ?? '',
    lastUpdated: (data.lastUpdated as string) ?? '',
    body: content,
  };
}

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <article className="py-section-y">
      <Container width="narrow">
        <header className="mb-section-y-tight">
          <h1
            className={cn(
              'font-display text-deep',
              'tracking-display-tight leading-display',
              'text-display-l',
            )}
          >
            {document.title}
          </h1>
          {document.lastUpdated && (
            <p className="mt-3 text-body-s text-muted">
              {t('legal', 'lastUpdatedLabel')}{' '}
              <time dateTime={document.lastUpdated}>
                {formatDate(document.lastUpdated)}
              </time>
            </p>
          )}
        </header>

        <div className="legal-prose">
          <MDXRemote source={document.body} components={blogMdxComponents} />
        </div>

        <footer
          className={cn(
            'mt-section-y rounded-[var(--radius)]',
            'border border-[rgba(43,30,24,0.08)] bg-[var(--color-beige)]',
            'px-6 py-6',
          )}
        >
          <h2 className="font-display text-display-m text-deep tracking-display-tight">
            {t('legal', 'contactBlockHeadline')}
          </h2>
          <p className="mt-3 text-body-l text-ink/85">
            {t('legal', 'contactBlockBody')}
          </p>
        </footer>
      </Container>
    </article>
  );
}
