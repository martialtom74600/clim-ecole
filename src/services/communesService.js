import { config } from '../config.js';
import { logger } from '../utils/logger.js';
import { fetchGeoCommunesForDepartments } from './geoCommunesService.js';
import { geoDepartementCode } from './epciMappingService.js';

export async function loadEligibleCommunes() {
  const communes = await fetchGeoCommunesForDepartments(config.departments);

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
