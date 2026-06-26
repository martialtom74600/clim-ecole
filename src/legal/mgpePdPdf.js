import PDFDocument from 'pdfkit';
import { config } from '../config.js';
import { MGPE_PD_REFERENCES, SUBSIDY_THRESHOLDS } from './mgpePdFramework.js';

function fmtEur(n) {
  return `${Math.round(n).toLocaleString('fr-FR')} €`;
}

function writeSection(doc, title, lines, { fontSize = 10 } = {}) {
  doc.moveDown(0.5);
  doc.fontSize(12).font('Helvetica-Bold').text(title, { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(fontSize).font('Helvetica');
  for (const line of lines) {
    if (typeof line === 'string') {
      doc.text(line, { align: 'justify', lineGap: 2 });
    } else if (line.bullet) {
      doc.text(`• ${line.bullet}`, { indent: 12, lineGap: 1 });
    }
  }
}

function writeChecklist(doc, title, items) {
  writeSection(doc, title, items.map((item) => ({ bullet: item })));
}

/**
 * Génère le PDF dossier mairie MGPE-PD en buffer
 * @param {object} dossier — retour buildCommuneDossier
 * @returns {Promise<Buffer>}
 */
export function generateMgpePdPdfBuffer(dossier) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const mp = dossier.mgpePd ?? {};
    const sim = mp.simulation ?? {};
    const sens = mp.sensitivity?.scenarioReference ?? {};

    doc.fontSize(18).font('Helvetica-Bold').text('Dossier d\'Instruction MGPE-PD', { align: 'center' });
    doc.fontSize(11).font('Helvetica').text(dossier.nomOfficiel ?? 'Commune', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#444').text(
      `Généré le ${new Date(dossier.generatedAt ?? Date.now()).toLocaleDateString('fr-FR')} — INSEE ${dossier.codeInsee ?? '—'}`,
      { align: 'center' },
    );
    doc.fillColor('#000');

    writeSection(doc, '1. Cadre juridique', [
      `${MGPE_PD_REFERENCES.loi}`,
      `${MGPE_PD_REFERENCES.decret}`,
      `Dérogation expérimentale au paiement différé (${MGPE_PD_REFERENCES.derogationPaiementDiffere}) — échéance ${MGPE_PD_REFERENCES.experimentalUntil}.`,
      `${MGPE_PD_REFERENCES.ccpMgp}`,
    ]);

    writeSection(doc, '2. Récapitulatif financier communal', [
      `Écoles concernées : ${dossier.schoolCount ?? 0}`,
      `Surface totale : ${Math.round(dossier.surfaceM2 ?? 0).toLocaleString('fr-FR')} m²`,
      `CAPEX estimé : ${fmtEur(dossier.capex ?? 0)}`,
      `Subventions État : ${dossier.subventionsFourchetteLabel ?? fmtEur(dossier.subventions ?? 0)}`,
      `CEE estimés : ${fmtEur(dossier.cee ?? 0)}`,
      `Part fonds (tiers-financement) : ${fmtEur(dossier.partFonds ?? 0)}`,
      `Économies annuelles estimées : ${fmtEur(dossier.economies ?? 0)}`,
      dossier.gainNetFourchetteLabel
        ? `Gain net annuel mairie (fourchette) : ${dossier.gainNetFourchetteLabel}`
        : null,
      `Taux subventions+CEE : ${mp.tauxSubventionEstimePct ?? 0} % (plafond ${SUBSIDY_THRESHOLDS.maxPublicSubsidyPct} %)`,
    ].filter(Boolean));

    writeSection(doc, '3. Simulation loyer synallagmatique Lt = Ft + St ± Pt', [
      `Durée contrat : ${sim.dureeContratAns ?? 12} ans`,
      `Redevance financière Ft (annuelle) : ${fmtEur(sim.redevanceFinanciereFt ?? 0)}`,
      `Part services St (annuelle) : ${fmtEur(sim.partServicesSt ?? 0)}`,
      `Loyer synallagmatique Lt estimé : ${fmtEur(sim.loyerSynallagmatiqueEstime ?? 0)} / an`,
      `Objectif GPE : −${sim.gainEnergieCiblePct ?? 45} % d'énergie finale`,
      `Prix kWh référence IPMVP : ${sens.prixKwhRef ?? config.getPrixKwhTertiaire()} €/kWh`,
      `Économie nette commune (scénario référence) : ${fmtEur(sens.economieNetteCommune ?? 0)} / an`,
    ]);

    writeSection(doc, '4. Parcours d\'instruction réglementaire', []);
    for (const step of mp.timeline ?? []) {
      doc.font('Helvetica-Bold').text(`${step.step}. ${step.title}`);
      doc.font('Helvetica').text(step.description, { indent: 12 });
      if (step.alert && step.alertText) {
        doc.fillColor('#b45309').text(`⚠ ${step.alertText}`, { indent: 12 });
        doc.fillColor('#000');
      }
      doc.moveDown(0.2);
    }

    writeChecklist(doc, '5. Checklist conformité CEE', mp.checklists?.cee ?? []);
    writeChecklist(doc, '6. Checklist subventions (DETR / DSIL / Fonds Vert)', mp.checklists?.subventions ?? []);
    writeChecklist(doc, '7. Clauses contractuelles obligatoires (Décret 2023-913)', mp.checklists?.contractuelles ?? []);
    writeChecklist(doc, '8. Assurances requises par le fonds', mp.checklists?.assurances ?? []);

    doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').text('9. Clause contractuelle type — Résiliation pour alternance politique', {
      underline: true,
    });
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').text(mp.resiliationClause ?? '', { align: 'justify', lineGap: 3 });

    if (mp.argumentaire) {
      doc.moveDown(1);
      writeSection(doc, '10. Argumentaire de présentation', [mp.argumentaire], { fontSize: 9 });
    }

    doc.end();
  });
}
