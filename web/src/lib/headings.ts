/*
  Markdown H2 extractor.

  Used by the blog post page to derive the table-of-contents data
  from the same MDX source that next-mdx-remote renders. Used by
  the legal pages for the section-navigator data.

  Slug logic mirrors github-slugger (the library rehype-slug uses
  internally) so the IDs match exactly what rehype-slug emits when
  rendering the same headings server-side. Without this match the
  TOC links wouldn't resolve.

  We don't import github-slugger directly because it is only a
  transitive dep (no direct dep entry in package.json), and the
  spec explicitly forbids adding new dependencies. The slugify
  function below replicates github-slugger's behavior for the
  Latin-script content used by the launch posts:

    - Lowercase the input.
    - Strip control chars, special punctuation, and emoji.
    - Replace runs of whitespace with single hyphens.
    - Strip leading/trailing hyphens.
    - Append `-N` to duplicates within the same document.

  Edge cases handled:
    - Code fences (``` ... ```): contents skipped so a literal `##`
      inside an example doesn't get treated as a heading.
    - Repeated heading text: counter appends -1, -2, etc.
    - ATX trailing hashes (`## Heading ##`): trimmed.
    - Blank lines or `##` with no text: ignored.
*/

export interface MarkdownHeading {
  /** Slug as github-slugger would generate. Matches rehype-slug output. */
  id: string;
  /** Visible heading text. */
  text: string;
}

const FENCE_RE = /^\s*```/;
const ATX_H2_RE = /^##\s+(.+?)\s*#*\s*$/;

/* github-slugger uses this exact regex to filter "noise" characters
   from the slug. Anything outside the allowed set becomes an empty
   string, then runs of whitespace collapse into a single hyphen. */
const NOISE_RE =
  /[ -⁯⸀-⹿\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~’]/g;

function slugifyOnce(text: string): string {
  return text
    .toLowerCase()
    .replace(NOISE_RE, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* Counter-based de-dup matching github-slugger's stateful slugger. */
class SluggerState {
  private counts = new Map<string, number>();
  slug(text: string): string {
    const base = slugifyOnce(text);
    if (!base) return '';
    const count = this.counts.get(base) ?? 0;
    this.counts.set(base, count + 1);
    return count === 0 ? base : `${base}-${count}`;
  }
}

export function extractH2Headings(markdown: string): MarkdownHeading[] {
  const slugger = new SluggerState();
  const headings: MarkdownHeading[] = [];
  const lines = markdown.split(/\r?\n/);
  let inFence = false;

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = ATX_H2_RE.exec(line);
    if (!m) continue;
    const text = m[1].trim();
    if (!text) continue;
    const id = slugger.slug(text);
    if (!id) continue;
    headings.push({ id, text });
  }

  return headings;
}
