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
import rehypeSlug from 'rehype-slug';
import { Container } from '@/components/Container';
import { blogMdxComponents } from '@/components/blog/mdx-components';
import { SectionNavigator } from '@/components/static/SectionNavigator';
import { extractH2Headings } from '@/lib/headings';
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
  /* Extract H2 headings from the markdown so the SectionNavigator
     can list them. Slug logic matches what rehype-slug emits in the
     rendered HTML so anchor links resolve. */
  const sections = extractH2Headings(document.body);

  return (
    <>
      {/* Mobile: "Jump to section" select renders here, sticky to
          viewport top below the nav. */}
      <div className="lg:hidden">
        <SectionNavigator sections={sections} variant="mobile" />
      </div>

      <article className="py-section-y">
        <Container width="default">
          {/* Two-column layout on lg+: prose on the left, sticky
              section navigator on the right. Single column on
              mobile (the navigator's mobile dropdown above
              substitutes). */}
          <div
            className={cn(
              'lg:grid lg:gap-10',
              'lg:grid-cols-[minmax(0,720px)_240px]',
              'lg:justify-center',
            )}
          >
            <div className="legal-prose min-w-0">
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

              <MDXRemote
                source={document.body}
                components={blogMdxComponents}
                options={{
                  mdxOptions: {
                    rehypePlugins: [rehypeSlug],
                  },
                }}
              />

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
            </div>

            {/* Desktop: sticky right-side nav inside the grid. */}
            <aside className="hidden lg:block">
              <SectionNavigator sections={sections} variant="desktop" />
            </aside>
          </div>
        </Container>
      </article>
    </>
  );
}
