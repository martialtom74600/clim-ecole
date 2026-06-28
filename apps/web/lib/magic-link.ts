import { signPayload, verifySignedPayload } from './crypto';
import { appUrl } from './stripe';
import { sendEmail } from './email';

export interface MagicLinkPayload {
  email: string;
  accountId: string;
  exp: number;
}

const MAGIC_TTL_MS = 1000 * 60 * 15; // 15 min

function magicSecret(): string {
  const base = process.env.AUTH_SECRET?.trim() ?? 'clim-magic-dev';
  return `magic:${base}`;
}

export function createMagicLinkToken(email: string, accountId: string): string {
  return signPayload(
    { email: email.trim().toLowerCase(), accountId, exp: Date.now() + MAGIC_TTL_MS },
    magicSecret(),
  );
}

export function verifyMagicLinkToken(token: string): MagicLinkPayload | null {
  const data = verifySignedPayload<MagicLinkPayload>(token, magicSecret());
  if (!data?.email || !data.accountId) return null;
  if (data.exp && Date.now() > data.exp) return null;
  return data;
}

export async function sendMagicLinkEmail(email: string, accountId: string): Promise<boolean> {
  const token = createMagicLinkToken(email, accountId);
  const url = `${appUrl()}/api/auth/magic-link/verify?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to: email,
    subject: 'Connexion à Clim École',
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h1 style="font-size:20px;font-weight:600">Connexion à votre compte</h1>
        <p style="color:#475569;line-height:1.6">Cliquez pour accéder à vos dossiers, pipeline et favoris sur tous vos appareils.</p>
        <p style="margin-top:24px">
          <a href="${url}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Se connecter
          </a>
        </p>
        <p style="margin-top:24px;font-size:12px;color:#94a3b8">Lien valide 15 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });
}
