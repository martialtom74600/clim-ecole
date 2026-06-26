/** Guide en langage simple — utilisateurs hors métier BTP / finance publique */

const STORAGE_KEY = 'clim-ecole-guide-dismissed';

const GLOSSARY = [
  { term: 'École sur la carte', plain: 'Un bâtiment scolaire où une rénovation énergétique est possible (taille, âge, mauvaise note énergie).' },
  { term: 'DPE (A à G)', plain: 'Note énergétique du bâtiment. G = le pire, A = le meilleur. On cible surtout D, E, F, G.' },
  { term: 'CAPEX / Investissement', plain: 'Coût total des travaux (isolation, chauffage, etc.).' },
  { term: 'Économies / an', plain: 'Argent économisé chaque année sur la facture d\'énergie après travaux.' },
  { term: 'Subventions', plain: 'Aides de l\'État / région qui réduisent la facture pour la mairie (estimation prudente).' },
  { term: 'Part fonds', plain: 'Part du coût financée par un investisseur privé (reste à charge après aides).' },
  { term: 'Loyer MGPE (Lt)', plain: 'Ce que la mairie « rembourse » chaque année à l\'investisseur, lié aux travaux (comme un loyer).' },
  { term: 'Gain net mairie', plain: 'Économies sur la facture − loyer. Si c\'est positif, la mairie gagne de l\'argent chaque année.' },
  { term: 'Solo', plain: 'Dossier assez gros pour être proposé seul à un financeur.' },
  { term: 'EPCI / Pack', plain: 'Regroupement territorial : toutes les écoles d\'une même intercommunalité (EPCI) forment un pack avec CAPEX et gains nets cumulés.' },
  { term: 'À regrouper', plain: 'École non finançable seule — incluse dans le pack EPCI de sa commune.' },
  { term: 'Artisan RGE', plain: 'Entreprise qualifiée pour faire les travaux, proche de l\'école.' },
  { term: 'Mairie', plain: 'Commune propriétaire — c\'est elle qu\'on contacte pour vendre le projet.' },
];

const STEPS = [
  { n: 1, title: 'Regardez la carte', body: 'Chaque point = une école. Couleur = note énergie (rouge = urgent). Cliquez sur un point.' },
  { n: 2, title: 'Lisez la fiche à droite', body: 'Vous voyez le coût, les économies, le gain pour la mairie et l\'artisan recommandé. Pas besoin de tout comprendre : regardez surtout « Gain net mairie ».' },
  { n: 3, title: 'Contactez la mairie', body: 'Bouton « Mairie » ou clic sur 🏛 sur la carte → PDF à télécharger pour expliquer le projet simplement.' },
  { n: 4, title: 'Priorisez', body: 'Dans le menu gauche (☰), « Prêtes à proposer seules » = les plus simples. « Écoles urgentes » = mauvais DPE.' },
];

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderGuideHtml() {
  return `
    <p class="text-sm leading-relaxed text-slate-300">
      Cet outil trouve <strong class="text-white">quelles écoles</strong> contacter, <strong class="text-white">combien ça coûte</strong>,
      <strong class="text-white">combien la mairie économise</strong>, et <strong class="text-white">quel artisan</strong> peut intervenir.
      Vous n'avez pas besoin d'être expert en BTP ou en subventions.
    </p>
    <div class="mt-4 rounded-xl border border-sky-500/30 bg-sky-950/30 p-3">
      <p class="text-[10px] font-semibold uppercase tracking-wider text-sky-400">En une phrase</p>
      <p class="mt-1 text-sm text-slate-200">« Voici une école de votre commune : les travaux coûtent X, la mairie peut économiser Y par an, voici l'entreprise RGE à côté. »</p>
    </div>
    <p class="mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">4 étapes</p>
    <ol class="mt-2 space-y-3">
      ${STEPS.map((s) => `
        <li class="flex gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-600 text-xs font-bold text-white">${s.n}</span>
          <div>
            <p class="text-sm font-medium text-slate-100">${escapeHtml(s.title)}</p>
            <p class="mt-1 text-[11px] leading-relaxed text-slate-400">${escapeHtml(s.body)}</p>
          </div>
        </li>`).join('')}
    </ol>
    <p class="mt-5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Mots du métier traduits</p>
    <dl class="mt-2 max-h-48 space-y-2 overflow-y-auto pr-1">
      ${GLOSSARY.map((g) => `
        <div class="rounded-lg bg-slate-900/80 px-3 py-2">
          <dt class="text-xs font-medium text-amber-200/90">${escapeHtml(g.term)}</dt>
          <dd class="mt-0.5 text-[11px] text-slate-400">${escapeHtml(g.plain)}</dd>
        </div>`).join('')}
    </dl>
    <p class="mt-4 text-[10px] text-slate-500">Astuce : touche <kbd class="rounded border border-slate-700 px-1">⌘K</kbd> pour chercher une commune ou une école par son nom.</p>
  `;
}

export function openBeginnerGuide() {
  const modal = document.getElementById('modal-guide');
  const body = document.getElementById('guide-body');
  if (!modal || !body) return;
  body.innerHTML = renderGuideHtml();
  modal.classList.remove('hidden');
}

export function closeBeginnerGuide(remember = false) {
  const modal = document.getElementById('modal-guide');
  modal?.classList.add('hidden');
  if (remember) {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch { /* ignore */ }
  }
}

export function shouldShowGuideOnStartup() {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
}

export function initBeginnerGuide({ showToast }) {
  document.getElementById('btn-guide')?.addEventListener('click', () => openBeginnerGuide());
  document.getElementById('btn-guide-menu')?.addEventListener('click', () => {
    document.getElementById('menu-dropdown')?.classList.add('hidden');
    openBeginnerGuide();
  });
  document.getElementById('guide-close')?.addEventListener('click', () => closeBeginnerGuide(false));
  document.getElementById('guide-close-remember')?.addEventListener('click', () => closeBeginnerGuide(true));
  document.getElementById('modal-guide')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-guide') closeBeginnerGuide(false);
  });

  if (shouldShowGuideOnStartup()) {
    setTimeout(() => openBeginnerGuide(), 800);
  } else if (showToast) {
    setTimeout(() => showToast('Besoin d\'aide ? Cliquez sur « Guide » en haut à droite (⋯)', 'info'), 2000);
  }
}

/** Résumé une ligne pour la fiche école — fourchette pessimiste → optimiste */
export function plainSchoolSummary(s, fmtEur) {
  const gainLabel = s.gainNetFourchetteLabel;
  const gain = s.gainNetMairie;
  if (gainLabel) {
    if ((s.gainNetOptimiste ?? gain ?? 0) > 15_000) {
      return `En résumé : après travaux, le gain net annuel mairie se situe entre ${gainLabel} (fourchette stress-test / plafond). Bon dossier à présenter.`;
    }
    if ((s.gainNetPessimiste ?? gain ?? 0) > 0) {
      return `En résumé : la mairie reste gagnante sur la fourchette ${gainLabel}. Dossier correct, à présenter avec le PDF mairie.`;
    }
    return `En résumé : le scénario pessimiste est déficitaire — je recommande le regroupement EPCI (statut « À regrouper »).`;
  }
  if (gain == null) return null;
  if (gain > 15_000) {
    return `En résumé : après travaux, la mairie pourrait gagner environ ${fmtEur.format(gain)} par an (économies d'énergie moins le loyer Lt). Bon dossier à présenter.`;
  }
  if (gain > 0) {
    return `En résumé : la mairie reste légèrement gagnante (~${fmtEur.format(gain)}/an). Dossier correct, à présenter avec le PDF mairie.`;
  }
  return `En résumé : les chiffres sont serrés pour la mairie. Mieux vaut regrouper au niveau EPCI (statut « À regrouper ») ou affiner le montage.`;
}
