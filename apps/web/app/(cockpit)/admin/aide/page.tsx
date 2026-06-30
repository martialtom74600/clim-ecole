import { GLOSSARY } from '@/lib/glossary';
import { Card, CardContent } from '@/components/ui/card';
import { CockpitVerdict } from '@/components/cockpit/cockpit-verdict';
import { ADMIN_VERDICTS } from '@/lib/site-narrative';

export default function AdminAidePage() {
  const v = ADMIN_VERDICTS.aide;

  return (
    <>
      <CockpitVerdict label={v.label} headline={v.headline} subline={v.subline} />
      <main className="page-content">
        <div className="grid gap-4 sm:grid-cols-2">
          {GLOSSARY.map((entry) => (
            <Card key={entry.term}>
              <CardContent className="p-5">
                <div className="mb-2 flex flex-wrap items-baseline gap-2">
                  <h2 className="text-[15px] font-semibold text-zen-teal">{entry.term}</h2>
                  <span className="text-sm text-zen-muted">= {entry.short}</span>
                </div>
                <p className="text-[15px] leading-relaxed text-ink-soft">{entry.plain}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </>
  );
}
