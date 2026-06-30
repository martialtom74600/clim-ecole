import { NarrativeVerdict } from '@/components/layout/narrative-page';

/** Verdict narratif pour pages cockpit admin — même logique que le SaaS client. */
export function CockpitVerdict({
  label,
  headline,
  subline,
  children,
}: {
  label: string;
  headline: string;
  subline?: string;
  children?: React.ReactNode;
}) {
  return (
    <NarrativeVerdict
      label={label}
      headline={headline}
      subline={subline}
      className="!border-zen-teal/20 !bg-zen-teal/[0.03]"
    >
      {children}
    </NarrativeVerdict>
  );
}
