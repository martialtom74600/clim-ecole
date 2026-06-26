const ZONE_A_VACATIONS = [
  { key: 'toussaint', label: 'Toussaint', startMonth: 10, startDay: 18, durationDays: 16 },
  { key: 'noel', label: 'Noël', startMonth: 12, startDay: 20, durationDays: 17 },
  { key: 'hiver', label: 'Février', startMonth: 2, startDay: 7, durationDays: 16 },
  { key: 'printemps', label: 'Printemps', startMonth: 4, startDay: 4, durationDays: 16 },
  { key: 'ete', label: 'Été', startMonth: 7, startDay: 4, durationDays: 58 },
];

const SHORT_VACATION_KEYS = new Set(['toussaint', 'noel', 'hiver', 'printemps']);

function resolveOuvriersRequis(surfaceM2) {
  const surface = Number(surfaceM2) || 0;
  if (surface > 3500) return 24;
  if (surface > 2000) return 12;
  return 6;
}

function buildVacationSlot(template, academicYearStart) {
  let year = academicYearStart;
  if (template.key === 'hiver' || template.key === 'printemps' || template.key === 'ete') {
    year = academicYearStart + 1;
  }

  const start = new Date(year, template.startMonth - 1, template.startDay);
  const end = new Date(start);
  end.setDate(end.getDate() + template.durationDays);

  return {
    key: template.key,
    label: template.label,
    year,
    start,
    end,
    weeks: Math.max(1, Math.round(template.durationDays / 7)),
  };
}

function buildVacationCalendar(fromDate, yearsAhead = 3) {
  const baseYear = fromDate.getFullYear();
  const slots = [];

  for (let offset = -1; offset <= yearsAhead; offset += 1) {
    const academicYearStart = baseYear + offset;
    for (const template of ZONE_A_VACATIONS) {
      slots.push(buildVacationSlot(template, academicYearStart));
    }
  }

  return slots
    .filter((slot) => slot.end > fromDate)
    .sort((a, b) => a.start - b.start);
}

function pickShortVacationPeriod(slots, durationWeeks) {
  for (const slot of slots) {
    if (!SHORT_VACATION_KEYS.has(slot.key)) continue;
    if (slot.weeks >= durationWeeks) {
      return `${slot.label} ${slot.year}`;
    }
  }

  const fallback = slots.find((slot) => SHORT_VACATION_KEYS.has(slot.key));
  return fallback ? `${fallback.label} ${fallback.year}` : 'Vacances Zone A à confirmer';
}

function pickSplitVacationPeriod(slots) {
  const summer = slots.find((slot) => slot.key === 'ete');
  if (!summer) {
    return 'Été + Automne (Zone A) à confirmer';
  }

  const autumn =
    slots.find((slot) => slot.key === 'toussaint' && slot.year === summer.year) ??
    slots.find((slot) => slot.key === 'toussaint' && slot.year === summer.year + 1);

  const autumnLabel = autumn ? `Automne ${autumn.year}` : `Automne ${summer.year}`;
  return `Été ${summer.year} + ${autumnLabel}`;
}

export function computeSitePlanning(technicalProfile, referenceDate = new Date()) {
  const heuresHommesTotal = technicalProfile.heuresHommesTotal ?? 0;
  const ouvriersRequis = resolveOuvriersRequis(technicalProfile.surfaceM2 ?? 0);
  const dureeEstimeeSemaines = Math.max(
    1,
    Math.round(heuresHommesTotal / (ouvriersRequis * 35)),
  );

  const vacationSlots = buildVacationCalendar(referenceDate);
  const periodeIdealeChantier =
    dureeEstimeeSemaines <= 2
      ? pickShortVacationPeriod(vacationSlots, dureeEstimeeSemaines)
      : pickSplitVacationPeriod(vacationSlots);

  return {
    ouvriersRequis,
    dureeEstimeeSemaines,
    periodeIdealeChantier,
  };
}
