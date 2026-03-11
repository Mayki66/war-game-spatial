import { altitudeTo3D } from '../rules/constants';

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
  let mercureMilitaireDeployed = false; // Règle spéciale de départ

  factions.forEach(faction => {
    const templates = [
      { orbit: 'LEO', main: 'Renseignement', sub: 'Ecoute', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Renseignement', sub: 'Observation', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Télécommunications', sub: 'Civil', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Scientifique', sub: 'Recherche', active: true, defaultErgol: 15 },
      { orbit: 'LEO', main: 'Militaire', sub: 'Protection', active: false, defaultErgol: 20 },
      { orbit: 'LEO', main: 'Militaire', sub: 'Menace', active: false, defaultErgol: 20 },
      
      { orbit: 'MEO', main: 'GNSS', sub: 'Civil', active: true, defaultErgol: 5 },
      { orbit: 'MEO', main: 'GNSS', sub: 'Militaire', active: true, defaultErgol: 5 },
      { orbit: 'MEO', main: 'Scientifique', sub: 'Recherche', active: true, defaultErgol: 15 },
      
      { orbit: 'GEO', main: 'Télécommunications', sub: 'Militaire', active: true, defaultErgol: 15 },
      { orbit: 'GEO', main: 'Télécommunications', sub: 'Civil', active: true, defaultErgol: 15 },
      { orbit: 'GEO', main: 'Scientifique', sub: 'Recherche', active: true, defaultErgol: 15 },
      { orbit: 'GEO', main: 'Militaire', sub: 'Protection', active: false, defaultErgol: 20 },
      { orbit: 'GEO', main: 'Militaire', sub: 'Menace', active: false, defaultErgol: 20 },
    ];

    templates.forEach(t => {
      for (let i = 0; i < 2; i++) {
        const id = `${faction.name.toLowerCase()}_${t.orbit.toLowerCase()}_${idCounter}`;
        
        // Paramètres orbitaux réels (en km)
        let realAltitude = 0; 
        let speed = 0;
        
        if (t.orbit === 'LEO') { realAltitude = 400 + Math.random() * 1100; speed = 0.8 + Math.random() * 0.4; } // 400 - 1500 km
        if (t.orbit === 'MEO') { realAltitude = 20000 + Math.random() * 4000; speed = 0.4 + Math.random() * 0.3; } // 20k - 24k km
        if (t.orbit === 'GEO') { realAltitude = 35764 + (Math.random() * 50 - 25); speed = 0.2; } // 35764 km +/- 25km

        const radius3D = altitudeTo3D(realAltitude);

        // Nomenclatures réalistes
        const baseName = getRealisticName(faction.name, t.orbit, t.main, t.sub);
        const serialNumber = Math.floor(Math.random() * 900) + 10;

        // Déploiement tactique initial de Mercure
        let isActive = t.active;
        if (faction.name === 'Mercure' && t.main === 'Militaire' && !mercureMilitaireDeployed) {
          isActive = true;
          mercureMilitaireDeployed = true; // Un seul est déployé
        }

        fleet[id] = {
          id: id, 
          name: `${baseName}-${serialNumber}`, 
          owner: faction.name, 
          color: faction.color,
          orbit: t.orbit, 
          realAltitudeKm: realAltitude,
          radius: radius3D, 
          currentRadius: radius3D, 
          inclination: (Math.random() * 45) * (Math.PI / 180),
          startAngle: Math.random() * Math.PI * 2, 
          speed: speed, 
          mainMission: t.main, 
          secondaryMission: t.sub,
          isActive: isActive, 
          status: isActive ? "Opérationnel" : "Hangar", 
          canRPO: t.main === 'Militaire' || t.main === 'Renseignement',
          hasRoboticArm: t.main === 'Scientifique', // Capacité spéciale du Google Sheet
          ergol: t.defaultErgol, 
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