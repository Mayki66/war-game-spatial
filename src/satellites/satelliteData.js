// Fonction pour attribuer le vrai nom du programme selon la mission et la faction
const getRealisticName = (faction, orbit, main, sub) => {
  if (faction === 'Celtica') {
    if (main === 'Renseignement' && sub === 'Ecoute') return 'CERES';
    if (main === 'Renseignement' && sub === 'Observation') return 'CSO';
    if (main === 'GNSS') return 'GALILEO';
    if (main === 'Télécommunications' && sub === 'Militaire') return 'SYRACUSE';
    if (main === 'Télécommunications' && sub === 'Civil') return orbit === 'LEO' ? 'KINEIS' : 'EUTELSAT';
    if (main === 'Scientifique') return orbit === 'LEO' ? 'TARANIS' : 'METEOSAT';
    if (main === 'Militaire' && sub === 'Protection') return 'YODA';
    if (main === 'Militaire' && sub === 'Menace') return 'TOUTATIS';
  }
  
  if (faction === 'Mercure') {
    if (main === 'Renseignement' && sub === 'Ecoute') return 'TSELINA';
    if (main === 'Renseignement' && sub === 'Observation') return 'YAOGAN';
    if (main === 'GNSS' && sub === 'Militaire') return 'GLONASS';
    if (main === 'GNSS' && sub === 'Civil') return 'BEIDOU';
    if (main === 'Télécommunications' && sub === 'Militaire') return 'RADUGA';
    if (main === 'Télécommunications' && sub === 'Civil') return orbit === 'LEO' ? 'GONETS' : 'EXPRESS';
    if (main === 'Scientifique') return orbit === 'LEO' ? 'LOMONOSOV' : 'FENGYUN';
    if (main === 'Militaire' && sub === 'Protection') return 'SHIJIAN';
    if (main === 'Militaire' && sub === 'Menace') return 'KOSMOS';
  }
  
  if (faction === 'Allié') {
    if (main === 'Renseignement' && sub === 'Ecoute') return 'MENTOR';
    if (main === 'Renseignement' && sub === 'Observation') return 'KEYHOLE';
    if (main === 'GNSS') return 'NAVSTAR';
    if (main === 'Télécommunications' && sub === 'Militaire') return 'AEHF';
    if (main === 'Télécommunications' && sub === 'Civil') return orbit === 'LEO' ? 'IRIDIUM' : 'INTELSAT';
    if (main === 'Scientifique') return orbit === 'LEO' ? 'LANDSAT' : 'GOES';
    if (main === 'Militaire' && sub === 'Protection') return 'GSSAP';
    if (main === 'Militaire' && sub === 'Menace') return 'X-37B';
  }
  
  return 'SAT';
};

export const generateFleet = () => {
  const factions = [
    { name: 'Celtica', color: '#3b82f6' },
    { name: 'Mercure', color: '#ef4444' },
    { name: 'Allié', color: '#22c55e' }
  ];

  const fleet = {};
  let idCounter = 1000;

  factions.forEach(faction => {
    const templates = [
      // --- LEO (Alt: 3.0 - 4.5 Mm) ---
      { orbit: 'LEO', main: 'Renseignement', sub: 'Ecoute', active: true },
      { orbit: 'LEO', main: 'Renseignement', sub: 'Observation', active: true },
      { orbit: 'LEO', main: 'Télécommunications', sub: 'Civil', active: true },
      { orbit: 'LEO', main: 'Scientifique', sub: 'Recherche', active: true },
      { orbit: 'LEO', main: 'Militaire', sub: 'Protection', active: false },
      { orbit: 'LEO', main: 'Militaire', sub: 'Menace', active: false },
      // --- MEO (Alt: 7.0 - 10.0 Mm) ---
      { orbit: 'MEO', main: 'GNSS', sub: 'Civil', active: true },
      { orbit: 'MEO', main: 'GNSS', sub: 'Militaire', active: true },
      { orbit: 'MEO', main: 'Scientifique', sub: 'Recherche', active: true },
      // --- GEO (Alt: 14.0 - 15.0 Mm) ---
      { orbit: 'GEO', main: 'Télécommunications', sub: 'Militaire', active: true },
      { orbit: 'GEO', main: 'Télécommunications', sub: 'Civil', active: true },
      { orbit: 'GEO', main: 'Scientifique', sub: 'Recherche', active: true },
      { orbit: 'GEO', main: 'Militaire', sub: 'Protection', active: false },
      { orbit: 'GEO', main: 'Militaire', sub: 'Menace', active: false },
    ];

    templates.forEach(t => {
      // 2 unités générées par configuration
      for (let i = 0; i < 2; i++) {
        const id = `${faction.name.toLowerCase()}_${t.orbit.toLowerCase()}_${idCounter}`;
        let radius = 0; let speed = 0;

        if (t.orbit === 'LEO') { radius = 3.0 + Math.random() * 1.5; speed = 0.8 + Math.random() * 0.4; }
        if (t.orbit === 'MEO') { radius = 7.0 + Math.random() * 3.0; speed = 0.4 + Math.random() * 0.3; }
        if (t.orbit === 'GEO') { radius = 14.0 + Math.random() * 1.0; speed = 0.2; } 

        const baseName = getRealisticName(faction.name, t.orbit, t.main, t.sub);
        // Ajout d'un numéro de série réaliste à 2 ou 3 chiffres
        const serialNumber = Math.floor(Math.random() * 900) + 10;
        const fullName = `${baseName}-${serialNumber}`;

        fleet[id] = {
          id: id, 
          name: fullName, 
          owner: faction.name, 
          color: faction.color,
          orbit: t.orbit, 
          radius: radius, 
          currentRadius: radius, 
          inclination: (Math.random() * 45) * (Math.PI / 180),
          startAngle: Math.random() * Math.PI * 2, 
          speed: speed, 
          mainMission: t.main, 
          secondaryMission: t.sub,
          isActive: t.active, 
          status: t.active ? "Opérationnel" : "Hangar", 
          canRPO: t.main === 'Militaire' || t.main === 'Renseignement',
          ergol: 15, 
          task: null, 
          jammedBy: null
        };
        idCounter++;
      }
    });
  });

  return fleet;
};

export const initialSatellites = generateFleet();