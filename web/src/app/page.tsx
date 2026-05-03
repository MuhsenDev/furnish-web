/*
  Phase 1 holding page. Phase 1F intentionally stops short of the
  hero motion sequence (Document 3 specifies the choreography).
  This page exists so the foundation can be smoke-tested in dev,
  not as the launch hero.
*/

import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { SectionDivider } from '@/components/SectionDivider';

export default function Home() {
  return (
    <Container width="default" className="py-section-y">
      <p className="eyebrow mb-4">Phase 1 foundation</p>
      <h1 className="font-display text-display-l tracking-display-tight leading-display-tight text-deep">
        Take a photo.
        <br />
        Furnish does
        <br />
        the rest.
      </h1>
      <p className="mt-6 max-w-narrow text-body-xl text-ink">
        Furnish is an app that fully designs any room from a single photo, and
        lets you shop every piece in it.
      </p>
      <div className="mt-10 flex gap-4">
        <Button variant="primary">Get the App</Button>
        <Button variant="secondary">See Examples</Button>
      </div>
      <SectionDivider className="mt-section-y" />
      <p className="mt-section-y-tight text-body-m text-muted">
        This page is a foundation smoke test. The launch hero arrives in
        Document 3 with the full motion choreography.
      </p>
    </Container>
  );
}
