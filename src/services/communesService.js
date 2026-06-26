import { config } from '../config.js';
import { api } from '../utils/apiClients.js';
import { logger } from '../utils/logger.js';

export async function loadEligibleCommunes() {
  const deptNumbers = config.departments.map((d) => d.replace(/^0/, ''));
  const communes = [];

  for (const dept of deptNumbers) {
    const data = await api.geo.getJson(`${config.apis.geo}/communes`, {
      params: {
        codeDepartement: dept,
        fields: 'nom,code,population,codesPostaux,centre',
        format: 'json',
      },
      label: 'geo.api.gouv.fr',
    });

    communes.push(...data);
  }

  const eligible = communes.filter(
    (c) => c.population >= config.populationMin && c.population <= config.populationMax,
  );

  const inseeCodes = new Set(eligible.map((c) => c.code));
  const postalCodes = [...new Set(eligible.flatMap((c) => c.codesPostaux ?? []))];

  logger.info(
    `${eligible.length} communes éligibles (${config.populationMin}–${config.populationMax} hab.) sur ${communes.length}`,
  );

  return { eligible, inseeCodes, postalCodes };
}
