import { HOME_ROI } from '@/lib/home-content';
import { NarrativeSection } from '@/components/layout/narrative-page';
import { cn } from '@/lib/utils';

export function HomeRoi() {
  const { label, title, description, without, with: withItems, calc, quote } = HOME_ROI;

  return (
    <NarrativeSection
      label={label}
      title={title}
      description={description}
      className="bg-surface-sunken/60"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-5 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            Sans Clim École
          </p>
          <ul className="mt-4 space-y-2.5">
            {without.map((line) => (
              <RoiLine key={line} negative>
                {line}
              </RoiLine>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-ink/15 bg-white p-5 shadow-raised ring-1 ring-ink/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink">Avec Clim École</p>
          <ul className="mt-4 space-y-2.5">
            {withItems.map((line) => (
              <RoiLine key={line} positive>
                {line}
              </RoiLine>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-positive-border bg-positive-soft p-5 md:p-6">
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-positive-text/80">
              Investissement
            </dt>
            <dd className="mt-1 text-sm font-medium text-positive-text">{calc.invest}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-positive-text/80">
              Upside type
            </dt>
            <dd className="mt-1 text-sm font-medium text-positive-text">{calc.upside}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-positive-text/80">
              Ratio
            </dt>
            <dd className="mt-1 text-sm font-semibold text-positive-text">{calc.ratio}</dd>
          </div>
        </dl>
        <p className="mt-4 border-t border-positive-border/60 pt-4 text-sm italic text-positive-text/90">
          « {quote} »
        </p>
      </div>
    </NarrativeSection>
  );
}

function RoiLine({
  children,
  negative,
  positive,
}: {
  children: React.ReactNode;
  negative?: boolean;
  positive?: boolean;
}) {
  return (
    <li className="flex items-start gap-2 text-sm text-ink-muted">
      <span
        className={cn(
          'mt-2 h-1.5 w-1.5 shrink-0 rounded-full',
          negative && 'bg-heat/70',
          positive && 'bg-positive',
          !negative && !positive && 'bg-ink-subtle',
        )}
      />
      <span className={positive ? 'text-ink-soft' : undefined}>{children}</span>
    </li>
  );
}
