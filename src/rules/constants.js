export const CLOCK_SPEED = 0.1;
export const LEO_MULTIPLIER = 12;

// Calcul du coût en Ergol et en Tours selon la distance orbitale
export const getManeuverCost = (originOrbit, targetOrbit = null) => {
  // Si pas de cible spécifiée ou même orbite (Intra-orbital)
  if (!targetOrbit || originOrbit === targetOrbit) {
    if (originOrbit === 'GEO') return 3;
    if (originOrbit === 'MEO') return 2;
    return 1; // LEO
  }

  // Si changement d'orbite ou influence Inter-Orbitale
  const levels = { 'LEO': 1, 'MEO': 2, 'GEO': 3 };
  const diff = Math.abs(levels[originOrbit] - levels[targetOrbit]);

  if (diff === 1) return 3; // Adjacente (LEO <-> MEO ou MEO <-> GEO)
  if (diff === 2) return 5; // Distante (LEO <-> GEO)

  return 1;
};