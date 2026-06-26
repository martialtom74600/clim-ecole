import { appUrl } from './stripe';

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return false;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendPurchaseConfirmationEmail(
  to: string,
  opts: { plan: 'dossier' | 'pro'; packUrl?: string },
): Promise<boolean> {
  const base = appUrl();
  const isPro = opts.plan === 'pro';

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h1 style="font-size:20px;font-weight:600">Accès Clim École activé</h1>
      <p style="color:#475569;line-height:1.6">
        ${
          isPro
            ? 'Votre abonnement Régional est actif. Tous les territoires du Radar sont débloqués.'
            : 'Votre dossier est débloqué. Identités, communes et contacts décideurs sont disponibles.'
        }
      </p>
      <h2 style="font-size:14px;font-weight:600;margin-top:24px">Prochaines étapes</h2>
      <ol style="color:#475569;line-height:1.8;padding-left:20px">
        <li>Consultez la liste des bâtiments et contacts mairie</li>
        <li>Exportez le CSV ou le dossier MGPE-PD depuis la deal room</li>
        <li>Ajoutez le territoire à votre watchlist pour le suivre</li>
      </ol>
      <p style="margin-top:28px">
        <a href="${opts.packUrl ?? `${base}/explorer`}" style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
          ${isPro ? 'Ouvrir le Radar' : 'Voir le dossier'}
        </a>
      </p>
      <p style="margin-top:32px;font-size:12px;color:#94a3b8">
        Clim École · Strate Studio · Données indicatives, non audit réglementaire.
      </p>
    </div>
  `;

  return sendEmail({
    to,
    subject: isPro ? 'Abonnement Radar activé — Clim École' : 'Dossier débloqué — Clim École',
    html,
  });
}

export async function sendAlertWelcomeEmail(to: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: 'Alertes Radar enregistrées — Clim École',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h1 style="font-size:20px;font-weight:600">Veille activée</h1>
        <p style="color:#475569;line-height:1.6">
          Vous recevrez un email lorsque de nouveaux territoires correspondant à vos critères seront publiés sur le Radar AURA.
        </p>
        <p style="margin-top:24px">
          <a href="${appUrl()}/explorer" style="color:#059669;font-weight:600">Parcourir le Radar →</a>
        </p>
      </div>
    `,
  });
}
