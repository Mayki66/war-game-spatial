// --- PARAMÈTRES DE TEMPS ---
export const CLOCK_SPEED = 0.1;
export const LEO_MULTIPLIER = 12;

// --- RÈGLES C2 (COMMAND & CONTROL) ---
export const MAX_ACTION_POINTS = 5; // 5 PA max par tour et par faction

// --- ÉCHELLE ORBITALE RÉELLE vs 3D ---
export const EARTH_RADIUS_KM = 6371;
export const EARTH_RADIUS_3D = 1.5;
export const KM_TO_3D_RATIO = EARTH_RADIUS_3D / EARTH_RADIUS_KM;

// Convertit une altitude réelle (en km) en distance 3D par rapport au centre de la Terre
export const altitudeTo3D = (altKm) => EARTH_RADIUS_3D + (altKm * KM_TO_3D_RATIO);

// Convertit un rayon 3D en altitude réelle (pour l'affichage UI)
export const threeDToAltitude = (radius3D) => (radius3D - EARTH_RADIUS_3D) / KM_TO_3D_RATIO;

// --- COÛTS LOGISTIQUES (ERGOL ET TOURS) ---
export const getManeuverCost = (originOrbit, targetOrbit = null) => {
  // Manœuvres Intra-orbitales
  if (!targetOrbit || originOrbit === targetOrbit) {
    if (originOrbit === 'GEO') return 3;
    if (originOrbit === 'MEO') return 2;
    return 1; // LEO
  }

  // Manœuvres Inter-orbitales (Cross-Orbit)
  const levels = { 'LEO': 1, 'MEO': 2, 'GEO': 3 };
  const diff = Math.abs(levels[originOrbit] - levels[targetOrbit]);

  if (diff === 1) return 3; // Orbites Adjacentes (ex: LEO <-> MEO)
  if (diff === 2) return 5; // Orbites Distantes (ex: LEO <-> GEO)

  return 1;
};