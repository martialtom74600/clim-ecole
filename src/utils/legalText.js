export function generateArgumentaireLoiElan(nomEcole, surfaceM2) {
  const name = (nomEcole ?? 'cet établissement').trim();
  const surface = Math.round(Number(surfaceM2) || 0);

  return (
    `En tant que propriétaire du groupe scolaire ${name}, votre collectivité est soumise aux obligations de l'article L. 111-10-3 du Code de la construction et de l'habitation (loi ELAN) ` +
    `et au Décret Tertiaire (objectif −40 % en 2030 pour les bâtiments ≥ 1 000 m²). ` +
    `Sans action d'ici 2030, le bâtiment de ${surface} m² s'expose aux sanctions administratives et au dispositif de « Name & Shame ». ` +
    `Le montage MGPE-PD (Loi 2023-222) permet un paiement différé lissé sur la performance réelle, compatible avec DETR, DSIL et Fonds Vert ÉduRénov.`
  );
}
